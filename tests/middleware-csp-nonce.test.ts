import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Middleware CSP nonce generation', () => {
  it('forwards the nonce CSP to Next.js and returns the same policy to the browser', () => {
    const request = new NextRequest('https://example.test/calculator');
    const response = middleware(request);
    const csp = response.headers.get('content-security-policy');
    const forwardedCsp = response.headers.get('x-middleware-request-content-security-policy');
    const overriddenHeaders = response.headers.get('x-middleware-override-headers') || '';

    expect(response.status).toBe(200);
    expect(csp).toBeTruthy();
    expect(csp).toMatch(/script-src[^;]*'nonce-[a-f0-9]{32}'/);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(forwardedCsp).toBe(csp);
    expect(overriddenHeaders.split(',')).toContain('content-security-policy');

    const scriptSource = csp?.split(';').find(directive => directive.trim().startsWith('script-src')) || '';
    expect(scriptSource).not.toContain("'unsafe-inline'");
    expect(scriptSource).not.toContain("'unsafe-eval'");
  });

  it('does not pass through the request without CSP headers', () => {
    const request = new NextRequest('https://example.test/');
    const response = middleware(request);

    expect(response.headers.get('content-security-policy')).toBeTruthy();
  });
});
