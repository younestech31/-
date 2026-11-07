#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, webcrypto } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function readOption(name, fallback = null) {
  const index = args.indexOf('--' + name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function pemToBytes(pem, label) {
  const match = pem.match(new RegExp('-----BEGIN ' + label + '-----([\\s\\S]+?)-----END ' + label + '-----'));
  if (!match) throw new Error('Invalid PEM file: expected ' + label + '.');
  return new Uint8Array(Buffer.from(match[1].replace(/\\s/g, ''), 'base64'));
}

function usage() {
  console.error([
    'Usage:',
    '  npm run license:issue -- --installation-id <ID> --customer <NAME> --days 30|90|365 [--output <FILE>]',
    '',
    'Optional: --license-id <ID> --private-key <PEM_PATH>',
    'Example:',
    '  npm run license:issue -- --installation-id "..." --customer "اسم المكتب" --days 90',
  ].join('\n'));
}

const installationId = readOption('installation-id');
const customerName = readOption('customer');
const days = Number(readOption('days'));
const privateKeyPath = path.resolve(root, readOption('private-key', '.license-keys/private-key.pem'));
const licenseId = readOption('license-id', 'MW-' + randomUUID());
const outputPath = path.resolve(root, readOption('output', 'mawarith-' + licenseId.replace(/[^A-Za-z0-9_-]/g, '_') + '.mwlicense'));

if (
  !installationId || installationId.length < 16 || installationId.length > 100 ||
  !customerName || customerName.trim().length < 2 || customerName.trim().length > 160 ||
  !licenseId || licenseId.length < 8 || licenseId.length > 100 ||
  ![30, 90, 365].includes(days)
) {
  usage();
  process.exit(1);
}

let privatePem;
try {
  privatePem = await readFile(privateKeyPath, 'utf8');
} catch {
  console.error('Cannot read private key at ' + privateKeyPath + '. Run npm run license:keys on the owner\'s offline computer first.');
  process.exit(1);
}

const privateKey = await webcrypto.subtle.importKey(
  'pkcs8',
  pemToBytes(privatePem, 'PRIVATE KEY'),
  { name: 'ECDSA', namedCurve: 'P-256' },
  false,
  ['sign'],
);

const issuedAt = new Date();
const expiresAt = new Date(issuedAt.getTime() + days * 24 * 60 * 60 * 1000);
const payload = {
  formatVersion: 1,
  product: 'mawarith',
  licenseId,
  customerName: customerName.trim(),
  plan: 'professional',
  issuedAt: issuedAt.toISOString(),
  expiresAt: expiresAt.toISOString(),
  installationId,
  features: ['professional-pdf-export'],
};

const signature = await webcrypto.subtle.sign(
  { name: 'ECDSA', hash: 'SHA-256' },
  privateKey,
  new TextEncoder().encode(stableStringify(payload)),
);

const envelope = {
  formatVersion: 1,
  algorithm: 'ECDSA-P256-SHA256',
  payload,
  signature: Buffer.from(signature).toString('base64'),
};

await writeFile(outputPath, JSON.stringify(envelope, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log('License issued successfully.');
console.log('License ID: ' + licenseId);
console.log('Customer: ' + payload.customerName);
console.log('Valid until: ' + payload.expiresAt);
console.log('Installation: ' + installationId);
console.log('File: ' + outputPath);
console.log('Send this .mwlicense file to the customer. Never send or expose the private key.');
