import { NextRequest, NextResponse } from 'next/server';
import { verifyExportToken } from '@/lib/auth/session';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

// Keep base64 + JSON framing safely below Vercel Functions' 4.5 MB body limit.
const MAX_PDF_BYTES = 3 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_PDF_BYTES / 3) * 4;
const MAX_REQUEST_BYTES = MAX_BASE64_CHARS + 4096;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'PDF payload is too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'PDF payload is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid export payload' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const pdfBase64 = data.pdfBase64;
    if (typeof pdfBase64 !== 'string' || pdfBase64.length === 0) {
      return NextResponse.json({ error: 'Missing pdfBase64 payload' }, { status: 400 });
    }
    if (pdfBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: 'PDF payload is too large' }, { status: 413 });
    }
    if (pdfBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64)) {
      return NextResponse.json({ error: 'Invalid PDF encoding' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    if (pdfBuffer.length === 0 || pdfBuffer.length > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'Invalid PDF size' }, { status: 400 });
    }
    if (pdfBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'The uploaded file is not a PDF' }, { status: 400 });
    }

    const bodyToken = typeof data.token === 'string' ? data.token : null;
    const headerToken = req.headers.get('x-export-token');
    const token = bodyToken || headerToken;
    const verified = token ? await verifyExportToken(token) : null;

    if (verified?.isPaid) {
      // Paid access comes only from a short-lived server-signed entitlement token.
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Free tier / unverified: stamp watermark server-side
    const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText('MAWARITH DEMO - UNVERIFIED EXPORT', {
        x: width * 0.15,
        y: height * 0.5,
        size: 26,
        font,
        color: rgb(0.8, 0.1, 0.1),
        opacity: 0.25,
        rotate: degrees(35),
      });
    }

    const watermarkedBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(watermarkedBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    console.error('[export/finalize] Failed to finalize PDF:', err);
    return NextResponse.json({ error: 'Unable to finalize PDF export' }, { status: 500 });
  }
}
