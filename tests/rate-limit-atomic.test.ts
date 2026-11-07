import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('@/lib/db/client');
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Database rate limiter uses an atomic UPSERT', () => {
  it('increments the stored count in one conflict-update operation', async () => {
    const returning = vi.fn().mockResolvedValue([{ count: 4 }]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    const database = { insert };

    vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

    const { checkRateLimit } = await import('@/lib/auth/rate-limit');
    const result = await checkRateLimit('login:test-ip', 5, 60_000);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(onConflictDoUpdate.mock.calls[0][0].set).toHaveProperty('count');
    expect(onConflictDoUpdate.mock.calls[0][0].set).toHaveProperty('resetTime');
    expect(result).toEqual({ success: true, remaining: 1 });
  });

  it('rejects the attempt when the atomic counter is already at its limit', async () => {
    const returning = vi.fn().mockResolvedValue([{ count: 5 }]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const database = { insert: vi.fn().mockReturnValue({ values }) };

    vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

    const { checkRateLimit } = await import('@/lib/auth/rate-limit');
    const result = await checkRateLimit('login:test-ip', 5, 60_000);

    expect(result).toEqual({ success: false, remaining: 0 });
  });

  it('fails closed in production when the database is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.doMock('@/lib/db/client', () => ({ getDb: () => null }));

    const { checkRateLimit } = await import('@/lib/auth/rate-limit');
    await expect(checkRateLimit('login:production-ip')).resolves.toEqual({
      success: false,
      remaining: 0,
    });
  });

  it('fails closed in production when the rate-limit database write fails', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const database = {
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: async () => { throw new Error('rate limit table unavailable'); },
          }),
        }),
      }),
    };
    vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

    const { checkRateLimit } = await import('@/lib/auth/rate-limit');
    await expect(checkRateLimit('login:production-ip')).resolves.toEqual({
      success: false,
      remaining: 0,
    });
  });
});
