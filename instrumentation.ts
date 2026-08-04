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

export async function register() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build' && !process.env.NEXT_PHASE?.includes('build')) {
    const missing: string[] = [];
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      missing.push('SESSION_SECRET (missing or under 32 bytes)');
    }
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      missing.push('STRIPE_SECRET_KEY (missing or invalid)');
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      missing.push('STRIPE_WEBHOOK_SECRET (missing or invalid)');
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
      missing.push('DATABASE_URL (missing or invalid)');
    }

    if (missing.length > 0) {
      throw new Error(`[Production Boot Error] Required environment variables are missing or malformed: ${missing.join(', ')}`);
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

