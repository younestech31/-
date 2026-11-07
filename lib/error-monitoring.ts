/**
 * Local-only client error reporting. No client diagnostics are transmitted.
 */
export interface ClientErrorPayload {
  errorMessage: string;
  componentStack?: string;
  route?: string;
  buildId?: string;
}

export function reportClientError(payload: ClientErrorPayload): void {
  if (typeof window === 'undefined') return;
  console.error('[Mawarith client error]', {
    errorMessage: (payload.errorMessage || 'Unknown error').slice(0, 500),
    componentStack: payload.componentStack ? payload.componentStack.slice(0, 2000) : undefined,
    route: payload.route || window.location.pathname,
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'production',
  });
}
