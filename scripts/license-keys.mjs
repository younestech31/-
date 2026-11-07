#!/usr/bin/env node
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keyDirectory = path.join(root, '.license-keys');
const privatePath = path.join(keyDirectory, 'private-key.pem');
const publicPath = path.join(keyDirectory, 'public-key.pem');
const clientKeyPath = path.join(root, 'lib', 'licensing', 'public-key.ts');
const rotate = process.argv.includes('--rotate');

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!rotate && (await exists(privatePath) || await exists(publicPath))) {
  console.error('A license key already exists. Refusing to overwrite it. Use --rotate only when intentionally replacing every issued license.');
  process.exit(1);
}

await mkdir(keyDirectory, { recursive: true, mode: 0o700 });
await chmod(keyDirectory, 0o700);
const pair = await webcrypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify'],
);

const privateDer = Buffer.from(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey));
const publicDer = Buffer.from(await webcrypto.subtle.exportKey('spki', pair.publicKey));
const toPem = (label, bytes) => {
  const base64 = bytes.toString('base64');
  const lines = base64.match(/.{1,64}/g) || [];
  return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----\n';
};

const privatePem = toPem('PRIVATE KEY', privateDer);
const publicPem = toPem('PUBLIC KEY', publicDer);
await writeFile(privatePath, privatePem, { mode: 0o600 });
await writeFile(publicPath, publicPem, { mode: 0o600 });
await chmod(privatePath, 0o600);
await chmod(publicPath, 0o600);

const publicKeyBase64 = publicDer.toString('base64');
const clientKeySource = [
  '/** Public ECDSA P-256 key. Safe to publish; never place the private key here. */',
  'export const LICENSE_PUBLIC_KEY_SPKI = ' + JSON.stringify(publicKeyBase64) + ';',
  '',
].join('\n');
await writeFile(clientKeyPath, clientKeySource, { mode: 0o644 });

console.log('Mawarith ECDSA P-256 key pair created.');
console.log('Private key (KEEP OFFLINE): ' + privatePath);
console.log('Public key: ' + publicPath);
console.log('Client verification key updated: lib/licensing/public-key.ts');
console.log('The private key directory is ignored by Git. Back it up offline in a secure location.');
console.log('Commit only lib/licensing/public-key.ts; never commit .license-keys/.');
