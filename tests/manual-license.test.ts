import { beforeAll, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  stableStringify,
  isPublicKeyConfigured,
  verifyLicenseEnvelopeWithKey,
  type MawarithLicensePayload,
} from '@/lib/licensing/manual-license';

const installationId = 'f2d43a1b-19bd-4b03-aef2-6e7f91b3b214';
const now = Date.parse('2026-11-07T12:00:00.000Z');
let publicKeyBase64 = '';
let envelope: {
  formatVersion: 1;
  algorithm: 'ECDSA-P256-SHA256';
  payload: MawarithLicensePayload;
  signature: string;
};

beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto);
  const pair = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  publicKeyBase64 = Buffer.from(await webcrypto.subtle.exportKey('spki', pair.publicKey)).toString('base64');
  const payload: MawarithLicensePayload = {
    formatVersion: 1,
    product: 'mawarith',
    licenseId: 'MW-TEST-0001',
    customerName: 'مكتب تجريبي',
    plan: 'professional',
    issuedAt: '2026-11-07T11:00:00.000Z',
    expiresAt: '2027-02-05T11:00:00.000Z',
    installationId,
    features: ['professional-pdf-export'],
  };
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    pair.privateKey,
    new TextEncoder().encode(stableStringify(payload)),
  );
  envelope = {
    formatVersion: 1,
    algorithm: 'ECDSA-P256-SHA256',
    payload,
    signature: Buffer.from(signature).toString('base64'),
  };
});

describe('Mawarith manual license verification', () => {
  it('recognizes configured and missing public verification keys safely', () => {
    expect(isPublicKeyConfigured('')).toBe(false);
    expect(isPublicKeyConfigured('not-a-key')).toBe(false);
    expect(isPublicKeyConfigured(publicKeyBase64)).toBe(true);
  });
  it('accepts a correctly signed, unexpired license for the matching installation', async () => {
    const result = await verifyLicenseEnvelopeWithKey(envelope, installationId, publicKeyBase64, now);
    expect(result.isPaid).toBe(true);
    expect(result.plan).toBe('professional');
    expect(result.license?.licenseId).toBe('MW-TEST-0001');
    expect(result.reason).toBeNull();
  });

  it('rejects a license issued for a different installation', async () => {
    const result = await verifyLicenseEnvelopeWithKey(envelope, 'another-installation-id-0001', publicKeyBase64, now);
    expect(result.isPaid).toBe(false);
    expect(result.reason).toBe('wrong_installation');
  });

  it('rejects expired licenses', async () => {
    const result = await verifyLicenseEnvelopeWithKey(envelope, installationId, publicKeyBase64, Date.parse('2027-02-06T00:00:00.000Z'));
    expect(result.isPaid).toBe(false);
    expect(result.reason).toBe('expired');
  });

  it('rejects payload tampering even when the envelope shape is still valid', async () => {
    const tampered = { ...envelope, payload: { ...envelope.payload, customerName: 'مكتب آخر' } };
    const result = await verifyLicenseEnvelopeWithKey(tampered, installationId, publicKeyBase64, now);
    expect(result.isPaid).toBe(false);
    expect(result.reason).toBe('signature_invalid');
  });

  it('rejects a missing public key or a malformed envelope without granting access', async () => {
    const missingKey = await verifyLicenseEnvelopeWithKey(envelope, installationId, '', now);
    const malformed = await verifyLicenseEnvelopeWithKey({ ...envelope, signature: '***' }, installationId, publicKeyBase64, now);
    expect(missingKey.reason).toBe('public_key_missing');
    expect(malformed.reason).toBe('license_malformed');
  });

  it('produces deterministic canonical JSON irrespective of object key insertion order', () => {
    expect(stableStringify({ b: 2, a: { y: 1, x: 0 } })).toBe(stableStringify({ a: { x: 0, y: 1 }, b: 2 }));
  });
});
