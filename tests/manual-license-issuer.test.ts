import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { verifyLicenseEnvelopeWithKey } from '@/lib/licensing/manual-license';

const execFileAsync = promisify(execFile);

function toPem(label: string, bytes: Uint8Array): string {
  const base64 = Buffer.from(bytes).toString('base64');
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

describe('Offline license issuer integration', () => {
  it('issues a .mwlicense file that the browser verifier accepts', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'mawarith-license-test-'));
    try {
      const pair = await webcrypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify'],
      );
      const privateDer = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey));
      const publicDer = new Uint8Array(await webcrypto.subtle.exportKey('spki', pair.publicKey));
      const privatePath = path.join(tempDirectory, 'private-key.pem');
      const outputPath = path.join(tempDirectory, 'issued.mwlicense');
      await writeFile(privatePath, toPem('PRIVATE KEY', privateDer), { mode: 0o600 });

      const installationId = '8a3a9fc4-cffd-4b45-8e43-ecad84eeb723';
      const scriptPath = path.resolve(process.cwd(), 'scripts/issue-license.mjs');
      await execFileAsync(process.execPath, [
        scriptPath,
        '--installation-id', installationId,
        '--customer', 'مكتب اختبار الترخيص',
        '--days', '30',
        '--license-id', 'MW-ISSUER-INTEGRATION-TEST',
        '--private-key', privatePath,
        '--output', outputPath,
      ]);

      const envelope = JSON.parse(await readFile(outputPath, 'utf8')) as unknown;
      const publicKeyBase64 = Buffer.from(publicDer).toString('base64');
      const status = await verifyLicenseEnvelopeWithKey(
        envelope,
        installationId,
        publicKeyBase64,
        Date.now(),
      );

      expect(status.isPaid).toBe(true);
      expect(status.license?.licenseId).toBe('MW-ISSUER-INTEGRATION-TEST');
      expect(status.license?.customerName).toBe('مكتب اختبار الترخيص');
      expect(status.license?.features).toEqual(['professional-pdf-export']);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });
});
