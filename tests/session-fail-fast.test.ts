import { afterEach, describe, it, expect, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('SESSION_SECRET Fail-Fast Validation (C8)', () => {
  it('throws an error on module import when SESSION_SECRET is missing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', undefined);

    await expect(import('@/lib/auth/session')).rejects.toThrow(/SESSION_SECRET/);
  });

  it('throws an error on module import when SESSION_SECRET is shorter than 32 characters', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'short_secret_under_32_chars');

    await expect(import('@/lib/auth/session')).rejects.toThrow(/SESSION_SECRET/);
  });
});
