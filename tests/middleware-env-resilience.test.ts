import { describe, it, expect, vi } from 'vitest';

describe('Server instrumentation without external service credentials', () => {
  it('registers safely when auth, database, email, and payment secrets are absent', async () => {
    vi.resetModules();
    const names = ['DATABASE_URL', 'SESSION_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY'];
    const previous = new Map(names.map(name => [name, process.env[name]]));
    for (const name of names) delete process.env[name];

    try {
      const { register } = await import('@/instrumentation');
      await expect(register()).resolves.toBeUndefined();
    } finally {
      for (const [name, value] of previous) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
