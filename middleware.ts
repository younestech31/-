import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://picsum.photos;
    font-src 'self' data:;
    connect-src 'self' ws: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors *;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-lang', 'ar');
  requestHeaders.set('x-pathname', encodeURIComponent(url.pathname));

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-lang', 'ar');
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|webp|svg|txt|xml|ttf|woff2?|webmanifest|json)).*)'],
};

