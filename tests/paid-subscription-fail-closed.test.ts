import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

const session = {
  userId: 'user-1',
  email: 'user@example.test',
  name: 'Test User',
  organizationId: 'org-1',
  plan: 'paid' as const,
  role: 'notary' as const,
};

async function verifyWithDatabase(database: unknown, includeEmailVerified = true) {
  vi.resetModules();
  const secret = process.env.SESSION_SECRET || '01234567890123456789012345678901';
  const token = await new SignJWT(includeEmailVerified ? { ...session, emailVerified: true } : session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));

  vi.doMock('next/headers', () => ({
    cookies: async () => ({ get: () => ({ value: token }) }),
  }));
  vi.doMock('@/lib/db/client', () => ({
    getDb: () => database,
  }));

  const { verifyPaidSubscription } = await import('@/lib/auth/session');
  return verifyPaidSubscription();
}

afterEach(() => {
  vi.doUnmock('next/headers');
  vi.doUnmock('@/lib/db/client');
  vi.resetModules();
});

describe('Paid subscription checks fail closed', () => {
  it('rejects legacy JWTs that were issued before email verification was enforced', async () => {
    const result = await verifyWithDatabase(null, false);
    expect(result.isPaid).toBe(false);
    expect(result.session).toBeNull();
  });

  it('does not trust a paid JWT when the database is unavailable', async () => {
    const result = await verifyWithDatabase(null);
    expect(result.isPaid).toBe(false);
    expect(result.session).toMatchObject({ userId: 'user-1', plan: 'free' });
  });

  it('denies paid access when the organization no longer exists', async () => {
    const database = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [] }),
        }),
      }),
    };

    const result = await verifyWithDatabase(database);
    expect(result.isPaid).toBe(false);
    expect(result.session?.plan).toBe('free');
  });

  it('denies paid access when the database query fails', async () => {
    const database = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => { throw new Error('database unavailable'); } }),
        }),
      }),
    };

    const result = await verifyWithDatabase(database);
    expect(result.isPaid).toBe(false);
    expect(result.session?.plan).toBe('free');
  });

  it('grants paid access only when the current database row says paid', async () => {
    const database = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [{ plan: 'paid' }] }),
        }),
      }),
    };

    const result = await verifyWithDatabase(database);
    expect(result.isPaid).toBe(true);
    expect(result.session?.plan).toBe('paid');
  });
});
