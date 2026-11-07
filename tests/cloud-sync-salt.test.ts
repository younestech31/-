import { afterEach, describe, expect, it, vi } from 'vitest';

type LoadOptions = {
  organizationRows: Array<Array<{ id: string; cloudSyncSalt: string | null }>>;
  updateRows?: Array<{ cloudSyncSalt: string | null }>;
  savedRows?: unknown[];
};

async function loadGetRoute(options: LoadOptions) {
  vi.resetModules();

  const organizationsTable = { tableName: 'organizations' };
  const savedCasesTable = { tableName: 'savedCases' };
  const organizationRows = [...options.organizationRows];
  const savedRows = options.savedRows || [];
  const updateRows = options.updateRows;

  const verifyPaidSubscription = vi.fn().mockResolvedValue({
    isPaid: true,
    session: {
      userId: 'user-a',
      email: 'user@example.test',
      name: 'Test User',
      organizationId: 'org-a',
      plan: 'paid',
      role: 'notary',
    },
  });

  const select = vi.fn(() => ({
    from: (table: unknown) => ({
      where: async () => {
        if (table === organizationsTable) return organizationRows.shift() || [];
        if (table === savedCasesTable) return savedRows;
        throw new Error('Unexpected table in GET query');
      },
    }),
  }));

  const updateSet = vi.fn((values: { cloudSyncSalt: string }) => ({
    where: async () => ({
      returning: async () => updateRows !== undefined
        ? updateRows
        : [{ cloudSyncSalt: values.cloudSyncSalt }],
    }),
  }));
  const update = vi.fn(() => ({ set: updateSet }));
  const database = { select, update };

  vi.doMock('@/lib/auth/session', () => ({ verifyPaidSubscription }));
  vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));
  vi.doMock('@/lib/db/schema', () => ({
    organizations: organizationsTable,
    savedCases: savedCasesTable,
  }));
  vi.doMock('drizzle-orm', () => ({
    eq: vi.fn((column: unknown, value: unknown) => ({ type: 'eq', column, value })),
    and: vi.fn((...conditions: unknown[]) => ({ type: 'and', conditions })),
    isNull: vi.fn((column: unknown) => ({ type: 'is-null', column })),
  }));

  const [{ GET }, { NextRequest }] = await Promise.all([
    import('@/app/api/cases/route'),
    import('next/server'),
  ]);

  return {
    GET: () => GET(new NextRequest('http://localhost/api/cases')),
    select,
    update,
    updateSet,
  };
}

afterEach(() => {
  vi.doUnmock('@/lib/auth/session');
  vi.doUnmock('@/lib/db/client');
  vi.doUnmock('@/lib/db/schema');
  vi.doUnmock('drizzle-orm');
  vi.resetModules();
});

describe('Cloud sync organization salt persistence', () => {
  it('returns 404 instead of issuing an ephemeral salt for a missing organization', async () => {
    const route = await loadGetRoute({ organizationRows: [[]] });
    const response = await route.GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: 'Organization not found' });
    expect(route.update).not.toHaveBeenCalled();
  });

  it('persists a newly generated 16-byte salt before returning it', async () => {
    const route = await loadGetRoute({
      organizationRows: [[{ id: 'org-a', cloudSyncSalt: null }]],
    });
    const response = await route.GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cloudSyncSalt).toMatch(/^[a-f0-9]{32}$/i);
    expect(route.update).toHaveBeenCalledTimes(1);
    expect(route.updateSet).toHaveBeenCalledWith({ cloudSyncSalt: data.cloudSyncSalt });
  });

  it('returns the already-persisted winner when another request initializes the salt first', async () => {
    const winningSalt = 'ab'.repeat(16);
    const route = await loadGetRoute({
      organizationRows: [
        [{ id: 'org-a', cloudSyncSalt: null }],
        [{ id: 'org-a', cloudSyncSalt: winningSalt }],
      ],
      updateRows: [],
    });
    const response = await route.GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cloudSyncSalt).toBe(winningSalt);
    expect(route.update).toHaveBeenCalledTimes(1);
    expect(route.select).toHaveBeenCalledTimes(3);
  });

  it('refuses to return a malformed persisted salt and never substitutes a fallback', async () => {
    const route = await loadGetRoute({
      organizationRows: [[{ id: 'org-a', cloudSyncSalt: 'not-a-valid-salt' }]],
    });
    const response = await route.GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: 'Cloud encryption salt is unavailable or invalid. No fallback salt was used.',
    });
    expect(route.update).not.toHaveBeenCalled();
  });
});
