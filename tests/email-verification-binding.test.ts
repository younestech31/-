import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadVerifyEmailRoute(returnedRows: unknown[]) {
  vi.resetModules();
  const verifyEmailVerificationToken = vi.fn().mockResolvedValue({
    userId: 'user-1',
    email: 'verified@example.test',
  });
  const returning = vi.fn().mockResolvedValue(returnedRows);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const database = { update };

  vi.doMock('@/lib/auth/session', () => ({ verifyEmailVerificationToken }));
  vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

  const { GET } = await import('@/app/api/auth/verify-email/route');
  const { NextRequest } = await import('next/server');
  return {
    GET: () => GET(new NextRequest('http://localhost/api/auth/verify-email?token=signed-token')),
    where,
    verifyEmailVerificationToken,
  };
}

afterEach(() => {
  vi.doUnmock('@/lib/auth/session');
  vi.doUnmock('@/lib/db/client');
  vi.resetModules();
});

describe('Email verification token binding', () => {
  it('does not confirm an account when the token user/email pair matches no row', async () => {
    const route = await loadVerifyEmailRoute([]);
    const response = await route.GET();

    expect(route.verifyEmailVerificationToken).toHaveBeenCalledWith('signed-token');
    expect(route.where).toHaveBeenCalledTimes(1);
    expect(response.headers.get('location')).toContain('/login?error=invalid_token');
  });

  it('confirms the account only when the token user/email pair matches', async () => {
    const route = await loadVerifyEmailRoute([{ id: 'user-1' }]);
    const response = await route.GET();

    expect(response.headers.get('location')).toContain('/login?info=email_verified');
  });
});
