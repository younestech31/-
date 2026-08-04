/**
 * Privacy-preserving client error reporter.
 * Transmits ONLY technical error metadata (message, stack, route, buildId).
 * NEVER transmits user inputs, estate figures, heir names, or DOM contents.
 */

export interface ClientErrorPayload {
  errorMessage: string;
  componentStack?: string;
  route?: string;
  buildId?: string;
}

export function reportClientError(payload: ClientErrorPayload): void {
  if (typeof window === 'undefined') return;

  try {
    const body = JSON.stringify({
      errorMessage: (payload.errorMessage || 'Unknown error').slice(0, 500),
      componentStack: payload.componentStack ? payload.componentStack.slice(0, 2000) : undefined,
      route: payload.route || window.location.pathname,
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'production',
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/client-error', blob);
    } else {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent error reporting failure
      });
    }
  } catch {
    // Fail silently so error reporting never causes secondary exceptions
  }
}
