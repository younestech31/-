import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/auth/rate-limit';

const MAX_REQUEST_BYTES = 8 * 1024;

function redactDiagnostic(value: string, maxLength: number): string {
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[PHONE]')
    .replace(/\b(?:sk|rk|pk|whsec|re)_[A-Za-z0-9_-]{8,}\b/gi, '[TOKEN]')
    .replace(/\b(password|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, maxLength);
}

function sanitizeRoute(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const path = value.split(/[?#]/, 1)[0];
  return redactDiagnostic(path, 200)
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, ':id')
    .replace(/\b\d{4,}\b/g, ':id');
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Error report payload is too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Error report payload is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid error payload' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    if (typeof data.errorMessage !== 'string' || !data.errorMessage.trim()) {
      return NextResponse.json({ error: 'Invalid error payload' }, { status: 400 });
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = req.headers.get('x-real-ip') || forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(`client-error:${clientIp}`, 20, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many error reports. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Client-supplied timestamps and build identifiers are untrusted. Store
    // only bounded, redacted diagnostics and a server-generated timestamp.
    const sanitizedErrorLog = {
      errorMessage: redactDiagnostic(data.errorMessage, 500),
      componentStack: typeof data.componentStack === 'string'
        ? redactDiagnostic(data.componentStack, 2000)
        : undefined,
      route: sanitizeRoute(data.route),
      buildId: typeof data.buildId === 'string'
        ? redactDiagnostic(data.buildId, 100)
        : 'unknown',
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'production') {
      console.error('[Production Client Error Monitor]', JSON.stringify(sanitizedErrorLog));
    } else {
      console.warn('[Dev Client Error Monitor]', sanitizedErrorLog);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process error report' }, { status: 500 });
  }
}
