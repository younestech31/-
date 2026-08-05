import { describe, it, expect, vi } from 'vitest';

describe('SESSION_SECRET Fail-Fast Validation (C8)', () => {
  it('throws an error on module import when SESSION_SECRET is deleted from process.env', async () => {
    vi.resetModules();
    const originalSecret = process.env.SESSION_SECRET;
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;

    try {
      await expect(import('@/lib/auth/session')).rejects.toThrow(
        /SESSION_SECRET/
      );
    } finally {
      process.env.SESSION_SECRET = originalSecret;
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('throws an error on module import when SESSION_SECRET is shorter than 32 characters', async () => {
    vi.resetModules();
    const originalSecret = process.env.SESSION_SECRET;
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'short_secret_under_32_chars';

    try {
      await expect(import('@/lib/auth/session')).rejects.toThrow(
        /SESSION_SECRET/
      );
    } finally {
      process.env.SESSION_SECRET = originalSecret;
      process.env.NODE_ENV = originalEnv;
    }
  });
});
