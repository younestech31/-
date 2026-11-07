import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
      const publicPath = path.join(tempDirectory, 'public-key.pem');
      const publicSourcePath = path.join(tempDirectory, 'public-key.ts');
      const outputPath = path.join(tempDirectory, 'issued.mwlicense');
      const publicKeyBase64 = Buffer.from(publicDer).toString('base64');
      await writeFile(privatePath, toPem('PRIVATE KEY', privateDer), { mode: 0o600 });
      await writeFile(publicPath, toPem('PUBLIC KEY', publicDer), { mode: 0o600 });
      await writeFile(publicSourcePath, `export const LICENSE_PUBLIC_KEY_SPKI = "${publicKeyBase64}";\n`, { mode: 0o600 });

      const installationId = '8a3a9fc4-cffd-4b45-8e43-ecad84eeb723';
      const scriptPath = path.resolve(process.cwd(), 'scripts/issue-license.mjs');
      await execFileAsync(process.execPath, [
        scriptPath,
        '--installation-id', installationId,
        '--customer', 'مكتب اختبار الترخيص',
        '--days', '30',
        '--license-id', 'MW-ISSUER-INTEGRATION-TEST',
        '--private-key', privatePath,
        '--public-key', publicPath,
        '--public-key-source', publicSourcePath,
        '--output', outputPath,
      ]);

      const envelope = JSON.parse(await readFile(outputPath, 'utf8')) as unknown;
      const status = await verifyLicenseEnvelopeWithKey(
        envelope,
        installationId,
        publicKeyBase64,
        Date.now(),
      );

      expect(status.isPaid).toBe(true);
      expect(status.license?.licenseId).toBe('MW-ISSUER-INTEGRATION-TEST');
      expect(status.license?.customerName).toBe('مكتب اختبار الترخيص');
      expect(status.license?.features).toEqual(['professional-pdf-export', 'encrypted-backup']);
      const invalidOutput = path.join(tempDirectory, 'invalid-plan.mwlicense');
      let invalidPlanRejected = false;
      try {
        await execFileAsync(process.execPath, [
          scriptPath,
          '--installation-id', installationId,
          '--customer', 'مكتب اختبار الترخيص',
          '--days', '31',
          '--private-key', privatePath,
          '--public-key', publicPath,
          '--public-key-source', publicSourcePath,
          '--output', invalidOutput,
        ]);
      } catch {
        invalidPlanRejected = true;
      }
      expect(invalidPlanRejected).toBe(true);
      await expect(readFile(invalidOutput, 'utf8')).rejects.toThrow();

      // A mismatched public key must fail before a license file is created.
      const wrongPair = await webcrypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify'],
      );
      const wrongPublicDer = new Uint8Array(await webcrypto.subtle.exportKey('spki', wrongPair.publicKey));
      const wrongPublicPath = path.join(tempDirectory, 'wrong-public-key.pem');
      const wrongPublicSourcePath = path.join(tempDirectory, 'wrong-public-key.ts');
      const wrongPublicKeyBase64 = Buffer.from(wrongPublicDer).toString('base64');
      await writeFile(wrongPublicPath, toPem('PUBLIC KEY', wrongPublicDer), { mode: 0o600 });
      await writeFile(wrongPublicSourcePath, `export const LICENSE_PUBLIC_KEY_SPKI = "${wrongPublicKeyBase64}";\n`, { mode: 0o600 });
      const mismatchedOutput = path.join(tempDirectory, 'mismatched.mwlicense');
      await expect(execFileAsync(process.execPath, [
        scriptPath,
        '--installation-id', installationId,
        '--customer', 'مكتب اختبار الترخيص',
        '--days', '30',
        '--private-key', privatePath,
        '--public-key', wrongPublicPath,
        '--public-key-source', wrongPublicSourcePath,
        '--output', mismatchedOutput,
      ])).rejects.toThrow();
      await expect(readFile(mismatchedOutput, 'utf8')).rejects.toThrow();
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });
  it('generates a matching offline key pair, locks down permissions, and refuses accidental overwrite', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'mawarith-keygen-test-'));
    try {
      const scriptsDirectory = path.join(tempRoot, 'scripts');
      const licensingDirectory = path.join(tempRoot, 'lib', 'licensing');
      await mkdir(scriptsDirectory, { recursive: true });
      await mkdir(licensingDirectory, { recursive: true });
      const sourceScript = await readFile(path.resolve(process.cwd(), 'scripts/license-keys.mjs'), 'utf8');
      const scriptPath = path.join(scriptsDirectory, 'license-keys.mjs');
      await writeFile(scriptPath, sourceScript, { mode: 0o600 });

      await execFileAsync(process.execPath, [scriptPath]);

      const keyDirectory = path.join(tempRoot, '.license-keys');
      const privatePath = path.join(keyDirectory, 'private-key.pem');
      const publicPath = path.join(keyDirectory, 'public-key.pem');
      const privatePem = await readFile(privatePath, 'utf8');
      const publicPem = await readFile(publicPath, 'utf8');
      const publicSource = await readFile(path.join(licensingDirectory, 'public-key.ts'), 'utf8');
      const publicKeyMatch = publicSource.match(/LICENSE_PUBLIC_KEY_SPKI = \"([A-Za-z0-9+/=]+)\"/);
      expect(publicKeyMatch?.[1]).toBeTruthy();
      expect((await stat(privatePath)).mode & 0o777).toBe(0o600);
      expect((await stat(keyDirectory)).mode & 0o777).toBe(0o700);

      const privateKey = await webcrypto.subtle.importKey(
        'pkcs8',
        Buffer.from(privatePem.replace(/-----[^-]+-----|\s/g, ''), 'base64'),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign'],
      );
      const publicKey = await webcrypto.subtle.importKey(
        'spki',
        Buffer.from(publicPem.replace(/-----[^-]+-----|\s/g, ''), 'base64'),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
      );
      const message = new TextEncoder().encode('mawarith-key-pair-self-test');
      const signature = await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, message);
      expect(await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, message)).toBe(true);
      expect(Buffer.from(publicPem.replace(/-----[^-]+-----|\s/g, ''), 'base64').toString('base64')).toBe(publicKeyMatch?.[1]);

      let overwriteRejected = false;
      try {
        await execFileAsync(process.execPath, [scriptPath]);
      } catch {
        overwriteRejected = true;
      }
      expect(overwriteRejected).toBe(true);
      expect(await readFile(privatePath, 'utf8')).toBe(privatePem);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});