import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { errorMessage, componentStack, route, buildId, timestamp } = body || {};

    if (!errorMessage || typeof errorMessage !== 'string') {
      return NextResponse.json({ error: 'Invalid error payload' }, { status: 400 });
    }

    // Privacy safeguard: Ensure log entry contains ONLY anonymized technical diagnostics
    const sanitizedErrorLog = {
      errorMessage: String(errorMessage).slice(0, 500),
      componentStack: componentStack ? String(componentStack).slice(0, 2000) : undefined,
      route: route ? String(route).slice(0, 200) : undefined,
      buildId: buildId ? String(buildId).slice(0, 100) : 'unknown',
      timestamp: timestamp || new Date().toISOString(),
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
