import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Remove trailing slashes (except root) while preserving query string
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    const targetUrl = new URL(url.pathname.slice(0, -1) + url.search, request.url);
    return NextResponse.redirect(targetUrl, { status: 301 });
  }

  // Enforce lowercase URLs while preserving query string
  const lowercasePath = url.pathname.toLowerCase();
  if (url.pathname !== lowercasePath) {
    const targetUrl = new URL(lowercasePath + url.search, request.url);
    return NextResponse.redirect(targetUrl, { status: 301 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-lang', 'ar');
  requestHeaders.set('x-pathname', url.pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-lang', 'ar');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|webp|svg|txt|xml|ttf|woff2?|webmanifest|json)).*)'],
};
