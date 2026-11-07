import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCspHeader } from '@/lib/security/csp';

function generateNonce(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Cryptographically secure nonce generation is unavailable.');
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
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

    // Enforce lowercase URLs for non-file ASCII paths while preserving query string
    const hasPercent = url.pathname.includes('%');
    const lowercasePath = url.pathname.toLowerCase();
    if (!hasPercent && url.pathname !== lowercasePath && !url.pathname.includes('.')) {
      // Check if path is plain ASCII before mutating
      if (/^[\x00-\x7F]*$/.test(url.pathname)) {
        const targetUrl = request.nextUrl.clone();
        targetUrl.pathname = lowercasePath;
        return NextResponse.redirect(targetUrl, { status: 301 });
      }
    }

    const nonce = generateNonce();
    const cspHeader = buildCspHeader(nonce).replace(/[\r\n]+/g, ' ').trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-lang', 'ar');

    let safePathname = url.pathname;
    try {
      safePathname = encodeURIComponent(url.pathname);
    } catch {
      safePathname = url.pathname.replace(/[^\x20-\x7E]/g, '');
    }
    requestHeaders.set('x-pathname', safePathname);
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
    console.error('Middleware security processing failed:', err);
    // Do not continue to the application without the nonce-based CSP headers.
    return new NextResponse('Secure request processing failed', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)).*)',
  ],
};



