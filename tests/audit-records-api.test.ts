import { afterEach, describe, expect, it, vi } from 'vitest';

const hash = 'a'.repeat(64);
const validPayload = () => ({
  combinedHash: hash,
  previousRecordHash: 'GENESIS',
  auditId: 'AUDIT-ABC1234',
  registryVersion: '2026.1.0',
  timestamp: '2026-11-07T00:00:00.000Z',
  buildId: 'test-build',
  summary: { estate: 100000, netEstate: 90000, heirCount: 3, stagesCount: 1 },
});

async function loadPost(existingRows: unknown[], insertedRows: unknown[] = []) {
  vi.resetModules();
  const select = vi.fn(() => ({
    from: () => ({
      where: () => ({ limit: async () => existingRows }),
    }),
  }));
  const onConflictDoNothing = vi.fn().mockReturnValue({
    returning: async () => insertedRows,
  });
  const insert = vi.fn(() => ({
    values: () => ({ onConflictDoNothing }),
  }));
  const database = { select, insert };

  vi.doMock('@/lib/db/client', () => ({ getDb: () => database }));
  vi.doMock('@/lib/auth/rate-limit', () => ({
    checkRateLimit: async () => ({ success: true, remaining: 9 }),
  }));

  const { POST } = await import('@/app/api/audit-records/route');
  const { NextRequest } = await import('next/server');
  const post = async (body: unknown) => POST(new NextRequest('http://localhost/api/audit-records', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));

  return { post, select, insert, onConflictDoNothing };
}

afterEach(() => {
  vi.doUnmock('@/lib/db/client');
  vi.doUnmock('@/lib/auth/rate-limit');
  vi.resetModules();
});

describe('Server audit ledger append-only guarantees', () => {
  it('rejects identifying or unknown summary fields', async () => {
    const { post, insert } = await loadPost([]);
    const payload = { ...validPayload(), summary: { ...validPayload().summary, heirNames: ['private'] } };

    const response = await post(payload);

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('treats an identical hash submission as idempotent without writing', async () => {
    const payload = validPayload();
    const existing = {
      combinedHash: payload.combinedHash,
      previousRecordHash: payload.previousRecordHash,
      auditId: payload.auditId,
      registryVersion: payload.registryVersion,
      timestamp: payload.timestamp,
      buildId: payload.buildId,
      summary: payload.summary,
    };
    const { post, insert } = await loadPost([existing]);

    const response = await post(payload);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ success: true, duplicate: true, combinedHash: hash });
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects attempts to overwrite an existing hash with different metadata', async () => {
    const payload = validPayload();
    const existing = {
      combinedHash: payload.combinedHash,
      previousRecordHash: payload.previousRecordHash,
      auditId: 'AUDIT-OTHER99',
      registryVersion: payload.registryVersion,
      timestamp: payload.timestamp,
      buildId: payload.buildId,
      summary: payload.summary,
    };
    const { post, insert } = await loadPost([existing]);

    const response = await post(payload);

    expect(response.status).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });

  it('stores a new valid audit record as an immutable insert', async () => {
    const payload = validPayload();
    const { post, insert, onConflictDoNothing } = await loadPost([], [{ combinedHash: hash }]);

    const response = await post(payload);

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(onConflictDoNothing).toHaveBeenCalledWith(expect.objectContaining({ target: expect.anything() }));
  });
});
