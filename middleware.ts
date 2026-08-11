import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCspHeader } from '@/lib/security/csp';

function generateNonce(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback if crypto is unavailable
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl;

    // Remove trailing slashes (except root) while preserving query string
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = url.pathname.slice(0, -1);
      return NextResponse.redirect(targetUrl, { status: 301 });
    }

    // Enforce lowercase URLs while preserving query string
    const hasPercent = url.pathname.includes('%');
    const lowercasePath = url.pathname.toLowerCase();
    if (!hasPercent && url.pathname !== lowercasePath) {
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = lowercasePath;
      return NextResponse.redirect(targetUrl, { status: 301 });
    }

    const nonce = generateNonce();
    const cspHeader = buildCspHeader(nonce);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-lang', 'ar');
    try {
      requestHeaders.set('x-pathname', encodeURIComponent(url.pathname));
    } catch {
      requestHeaders.set('x-pathname', url.pathname);
    }
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('x-lang', 'ar');
    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
  } catch (err) {
    console.error('Middleware invocation error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
};

