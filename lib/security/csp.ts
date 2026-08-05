export function buildCspHeader(nonce?: string): string {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : '';
  const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", nonceDirective].filter(Boolean).join(' ');

  return `
    default-src 'self' data: blob: https:;
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data: https:;
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors *;
  `.replace(/\s{2,}/g, ' ').trim();
}

