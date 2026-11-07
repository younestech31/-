export function buildCspHeader(nonce?: string): string {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : '';
  const developmentEval = process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : '';
  const scriptSrc = ["'self'", nonceDirective, developmentEval].filter(Boolean).join(' ');

  return [
    "default-src 'self' data: blob: https:",
    `script-src ${scriptSrc}`,
    // Keep inline styles for the current styling stack; script execution is nonce-gated.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; ');
}


