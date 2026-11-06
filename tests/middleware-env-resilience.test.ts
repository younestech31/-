import { describe, it, expect, vi } from 'vitest';

describe('Middleware & Server Environment Resilience (P0 Remediation)', () => {
  it('does not throw in production when optional SaaS env vars are missing', async () => {
    vi.resetModules();
    const originalEnv = process.env.NODE_ENV;
    const originalDbUrl = process.env.DATABASE_URL;
    const originalStripeKey = process.env.STRIPE_SECRET_KEY;
    const originalStripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;

    const envMap = process.env as Record<string, string | undefined>;
    envMap.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
      const config = validateEnv();
      expect(config).toBeDefined();
      expect(config?.SESSION_SECRET).toBeDefined();
    } finally {
      envMap.NODE_ENV = originalEnv;
      if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl;
      if (originalStripeKey) process.env.STRIPE_SECRET_KEY = originalStripeKey;
      if (originalStripeWebhook) process.env.STRIPE_WEBHOOK_SECRET = originalStripeWebhook;
    }
  });

  it('register() in instrumentation executes safely without throwing uncaught exceptions', async () => {
    vi.resetModules();
    const originalEnv = process.env.NODE_ENV;
    const originalRuntime = process.env.NEXT_RUNTIME;

    const envMap = process.env as Record<string, string | undefined>;
    envMap.NODE_ENV = 'production';
    envMap.NEXT_RUNTIME = 'nodejs';

    try {
      const { register } = await import('@/instrumentation');
      await expect(register()).resolves.not.toThrow();
    } finally {
      envMap.NODE_ENV = originalEnv;
      envMap.NEXT_RUNTIME = originalRuntime;
    }
  });
});
