import { describe, expect, it } from 'vitest';
import { computeSha256, createCalculationAuditRecord } from '@/lib/inheritance/calculation-audit';

describe('Calculation audit cryptographic primitives', () => {
  it('computes a standards-compliant SHA-256 digest', async () => {
    await expect(computeSha256('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('creates audit IDs using cryptographically secure random UUIDs', async () => {
    const record = await createCalculationAuditRecord(
      { estate: 120000, netEstate: 100000, stages: [{ id: 'stage-0' }] },
      [{ heirId: 'son', amount: 100000 }]
    );

    expect(record.auditId).toMatch(/^AUDIT-[A-F0-9]{32}$/);
    expect(record.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(record.sharesHash).toMatch(/^[a-f0-9]{64}$/);
    expect(record.combinedHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
