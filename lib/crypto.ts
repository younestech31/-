// lib/crypto.ts
// WebCrypto (AES-GCM 256-bit) per-device encryption and decryption helpers for secure persistence.
// Keys are derived per-device using crypto.getRandomValues and stored in IndexedDB (never hardcoded in source code).

let inMemoryKeyCache: CryptoKey | null = null;

const DB_NAME = 'MawarithDeviceKeys';
const STORE_NAME = 'keys';
const KEY_NAME = 'deviceAESKey';

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

async function loadRawKeyFromIDB(): Promise<Uint8Array | null> {
  const idb = getIndexedDB();
  if (!idb) return null;

  return new Promise((resolve) => {
    try {
      const request = idb.open(DB_NAME, 1);
      request.onupgradeneeded = (e: Event) => {
        const target = e.target as IDBOpenDBRequest;
        const db = target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e: Event) => {
        const target = e.target as IDBOpenDBRequest;
        const db = target.result;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(KEY_NAME);
        getReq.onsuccess = () => resolve(getReq.result ? new Uint8Array(getReq.result) : null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveRawKeyToIDB(rawKeyBytes: Uint8Array): Promise<void> {
  const idb = getIndexedDB();
  if (!idb) return;

  return new Promise((resolve) => {
    try {
      const request = idb.open(DB_NAME, 1);
      request.onupgradeneeded = (e: Event) => {
        const target = e.target as IDBOpenDBRequest;
        const db = target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e: Event) => {
        const target = e.target as IDBOpenDBRequest;
        const db = target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(rawKeyBytes, KEY_NAME);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getDeviceCryptoKey(): Promise<CryptoKey> {
  if (inMemoryKeyCache) return inMemoryKeyCache;

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('WebCrypto API is not available');
  }

  // Attempt to load existing raw key bytes from IndexedDB
  let rawKeyBytes = await loadRawKeyFromIDB();

  if (!rawKeyBytes) {
    // Generate new random 256-bit key per device using crypto.getRandomValues
    rawKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
    await saveRawKeyToIDB(rawKeyBytes);
  }

  // Import raw key bytes as AES-GCM CryptoKey
  inMemoryKeyCache = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return inMemoryKeyCache;
}

/**
 * Legacy fallback key derivation for migrating older encrypted data.
 */
async function getLegacyKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.digest(
      'SHA-256',
      enc.encode('MawarithDzSecureLocalStorageEncryptionKey')
    );
    return await window.crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  } catch {
    return null;
  }
}

/**
 * DEPRECATED BASE64 HELPERS — WARNING: These functions provide NO confidentiality or encryption.
 * They MUST NEVER be used for saved cases or sensitive data storage.
 * Use real WebCrypto AES-GCM functions (encryptData / decryptData / encryptDataWithPassphrase) instead.
 */
export function base64Encode(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error('Failed to encode data:', e);
    return '';
  }
}

export function base64Decode<T = unknown>(encodedData: string): T | null {
  if (!encodedData) return null;
  try {
    const jsonStr = decodeURIComponent(atob(encodedData));
    return JSON.parse(jsonStr) as T;
  } catch {
    try {
      return JSON.parse(encodedData) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user-provided passphrase and non-secret salt using PBKDF2 (100,000 iterations).
 */
export async function deriveKeyFromPassphrase(passphrase: string, saltHex: string): Promise<CryptoKey> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('WebCrypto API is not available');
  }

  const enc = new TextEncoder();
  const passphraseBytes = enc.encode(passphrase);

  // Parse saltHex to Uint8Array
  const matched = saltHex.match(/.{1,2}/g) || [];
  const saltBytes = new Uint8Array(matched.length > 0 ? matched.map(b => parseInt(b, 16)) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext data using a passphrase-derived AES-GCM key.
 */
export async function encryptDataWithPassphrase(data: string, passphrase: string, saltHex: string): Promise<string> {
  const key = await deriveKeyFromPassphrase(passphrase, saltHex);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encodedData = enc.encode(data);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const ivAndCipher = new Uint8Array(iv.length + cipherBuffer.byteLength);
  ivAndCipher.set(iv, 0);
  ivAndCipher.set(new Uint8Array(cipherBuffer), iv.length);

  return btoa(String.fromCharCode(...ivAndCipher));
}

/**
 * Decrypts AES-GCM ciphertext string using a passphrase-derived key.
 */
export async function decryptDataWithPassphrase(base64Data: string, passphrase: string, saltHex: string): Promise<string> {
  const binaryStr = atob(base64Data);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  if (bytes.length < 12) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = bytes.slice(0, 12);
  const cipherText = bytes.slice(12);

  const key = await deriveKeyFromPassphrase(passphrase, saltHex);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherText
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getDeviceCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedData = enc.encode(data);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    // Combine IV and CipherText
    const ivAndCipher = new Uint8Array(iv.length + cipherBuffer.byteLength);
    ivAndCipher.set(iv, 0);
    ivAndCipher.set(new Uint8Array(cipherBuffer), iv.length);

    // Return Base64 string
    return btoa(String.fromCharCode(...ivAndCipher));
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts an AES-GCM 256-bit encrypted base64 string back to plaintext using the device-specific key,
 * with legacy fallback support.
 */
export async function decryptData(base64Data: string): Promise<string> {
  let binaryStr = '';
  try {
    binaryStr = atob(base64Data);
  } catch {
    throw new Error('Invalid base64 string');
  }

  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  if (bytes.length < 12) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = bytes.slice(0, 12);
  const cipherText = bytes.slice(12);

  // 1. Try decrypting with device-specific key
  try {
    const key = await getDeviceCryptoKey();
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherText
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    // 2. Try legacy key fallback for previously encrypted data
    try {
      const legacyKey = await getLegacyKey();
      if (legacyKey) {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          legacyKey,
          cipherText
        );
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
      }
    } catch {
      // ignore fallback error
    }

    throw new Error('Decryption failed');
  }
}
