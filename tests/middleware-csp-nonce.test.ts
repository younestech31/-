import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Middleware CSP nonce generation', () => {
  it('sets a cryptographically random nonce in the CSP for page requests', () => {
    const request = new NextRequest('https://example.test/calculator');
    const response = middleware(request);
    const csp = response.headers.get('content-security-policy');

    expect(response.status).toBe(200);
    expect(csp).toBeTruthy();
    expect(csp).toMatch(/script-src[^;]*'nonce-[a-f0-9]{32}'/);
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it('does not pass through the request without CSP headers', () => {
    const request = new NextRequest('https://example.test/');
    const response = middleware(request);

    expect(response.headers.get('content-security-policy')).toBeTruthy();
  });
});
