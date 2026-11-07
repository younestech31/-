export async function register() {
  // Mawarith has no required server-side auth, database, or billing secrets.
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
