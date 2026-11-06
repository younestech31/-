/**
 * PRIVACY MANDATE WARNING FOR FUTURE CONTRIBUTORS:
 * =========================================================================================
 * As documented in app/page.tsx and app/privacy/page.tsx, this application guarantees strict
 * inheritance confidentiality under Algerian Notary Law (Law 06-02).
 *
 * DO NOT add third-party tracking tools or default configurations (e.g., Sentry, LogRocket)
 * that enable DOM breadcrumbs, session replay (replaysOnErrorSampleRate > 0), request body
 * capture, or full-page HTML/state recording.
 *
 * All error monitoring MUST remain lightweight and strictly restricted to non-identifying
 * technical stack traces, error messages, route names, and build IDs.
 * =========================================================================================
 */

import { validateEnv } from '@/lib/env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || typeof window === 'undefined') {
    try {
      validateEnv();
    } catch (err) {
      console.warn('[Startup Notice] Running with local fallback environment:', err);
    }
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Headers },
  context: { routerKind: string; routePath: string }
) {
  if (process.env.NODE_ENV === 'production') {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Production Server Error Monitor]', JSON.stringify({
      errorMessage: errorMsg.slice(0, 500),
      route: request.path || context.routePath,
      method: request.method,
      timestamp: new Date().toISOString(),
    }));
  }
}

