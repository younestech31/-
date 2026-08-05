import { NextRequest, NextResponse } from 'next/server';
import { verifyExportToken } from '@/lib/auth/session';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, token: bodyToken } = body || {};
    const headerToken = req.headers.get('x-export-token');
    const token = bodyToken || headerToken;

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Missing pdfBase64 payload' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const verified = token ? await verifyExportToken(token) : null;

    if (verified?.isPaid) {
      // Paid user: return PDF bytes un-watermarked
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
        },
      });
    }

    // Free tier / unverified: stamp watermark server-side
    const pdfDoc = await PDFDocument.load(pdfBuffer);
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
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export finalization error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
