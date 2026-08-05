import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCspHeader } from '@/lib/security/csp';

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl;

    // Remove trailing slashes (except root) while preserving query string
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      const targetUrl = new URL(url.pathname.slice(0, -1) + url.search, request.url);
      return NextResponse.redirect(targetUrl, { status: 301 });
    }

    // Enforce lowercase URLs while preserving query string
    const hasPercent = url.pathname.includes('%');
    const lowercasePath = url.pathname.toLowerCase();
    if (!hasPercent && url.pathname !== lowercasePath) {
      const targetUrl = new URL(lowercasePath + url.search, request.url);
      return NextResponse.redirect(targetUrl, { status: 301 });
    }

    const nonce = typeof btoa === 'function' ? btoa(crypto.randomUUID()) : crypto.randomUUID();
    const cspHeader = buildCspHeader(nonce);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-lang', 'ar');
    requestHeaders.set('x-pathname', encodeURIComponent(url.pathname));
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|webp|svg|txt|xml|ttf|woff2?|webmanifest|json)).*)'],
};

