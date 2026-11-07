import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadRoutes(updateRows: unknown[], deleteRows: unknown[]) {
  vi.resetModules();
  const session = {
    userId: 'user-a',
    email: 'user@example.test',
    name: 'Test User',
    organizationId: 'org-a',
    plan: 'paid' as const,
    role: 'notary' as const,
  };
  const verifyPaidSubscription = vi.fn().mockResolvedValue({ isPaid: true, session });
  const updateWhere = vi.fn().mockReturnValue({ returning: async () => updateRows });
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });
  const deleteWhere = vi.fn().mockReturnValue({ returning: async () => deleteRows });
  const deleteRowsFn = vi.fn().mockReturnValue({ where: deleteWhere });
  const database = { update, delete: deleteRowsFn };

  vi.doMock('@/lib/auth/session', () => ({ verifyPaidSubscription }));
  vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));

  const [{ PUT, DELETE }, { NextRequest }] = await Promise.all([
    import('@/app/api/cases/[id]/route'),
    import('next/server'),
  ]);

  const makeRequest = () => new NextRequest('http://localhost/api/cases/case-1', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      caseNameEncrypted: 'name-cipher',
      caseDateEncrypted: 'date-cipher',
      notaryIdEncrypted: 'notary-cipher',
      isCloudSynced: true,
      encryptedPayload: 'payload-cipher',
    }),
  });

  return {
    PUT: () => PUT(makeRequest(), { params: Promise.resolve({ id: 'case-1' }) }),
    DELETE: () => DELETE(new NextRequest('http://localhost/api/cases/case-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'case-1' }),
    }),
    update,
    deleteRowsFn,
  };
}

afterEach(() => {
  vi.doUnmock('@/lib/auth/session');
  vi.doUnmock('@/lib/db/client');
  vi.resetModules();
});

describe('Cloud case mutations report missing or foreign rows', () => {
  it('returns 404 when a case update matches no row in the current organization', async () => {
    const routes = await loadRoutes([], []);
    const response = await routes.PUT();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: 'Case not found' });
  });

  it('returns success when a case update affects the organization-owned row', async () => {
    const routes = await loadRoutes([{ id: 'case-1' }], []);
    const response = await routes.PUT();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, id: 'case-1' });
  });

  it('returns 404 when deleting a case outside the current organization', async () => {
    const routes = await loadRoutes([], []);
    const response = await routes.DELETE();

    expect(response.status).toBe(404);
  });

  it('returns success when deleting an organization-owned case', async () => {
    const routes = await loadRoutes([], [{ id: 'case-1' }]);
    const response = await routes.DELETE();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, id: 'case-1' });
  });
});
