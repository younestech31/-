// lib/crypto.ts
// WebCrypto (AES-GCM 256-bit) encryption and decryption helpers for secure localStorage persistence.

const SALT = new Uint8Array([77, 97, 119, 97, 114, 105, 116, 104, 95, 68, 122, 95, 83, 97, 108, 116]); // "Mawarith_Dz_Salt"
const PASSWORD = "MawarithDzSecureLocalStorageEncryptionKey";

let cryptoKeyCache: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKeyCache) return cryptoKeyCache;
  
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error("WebCrypto API is not available");
  }
  
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(PASSWORD),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  cryptoKeyCache = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  
  return cryptoKeyCache;
}

/**
 * Encrypts a string using AES-GCM 256-bit encryption.
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedData = enc.encode(data);
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
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
    console.error("Encryption failed:", err);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts an AES-GCM 256-bit encrypted base64 string back to plaintext.
 */
export async function decryptData(base64Data: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    if (bytes.length < 12) {
      throw new Error("Invalid encrypted data format");
    }
    
    const iv = bytes.slice(0, 12);
    const cipherText = bytes.slice(12);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      cipherText
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Decryption failed");
  }
}
