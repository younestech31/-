// tests/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../lib/crypto';

// Polyfill window and window.crypto for Node-based test runner (vitest)
import { webcrypto } from 'node:crypto';

if (typeof window === 'undefined') {
  global.window = {
    crypto: webcrypto as unknown as Crypto,
  } as unknown as Window & typeof globalThis;
} else if (!window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

describe('Cryptographic Persistence Layer (AES-GCM)', () => {
  it('should encrypt and decrypt data correctly, restoring original string', async () => {
    const originalText = JSON.stringify([
      { id: 'case-1', name: 'مسألة إرث عائلية', estate: 500000 },
    ]);

    const cipherText = await encryptData(originalText);
    expect(cipherText).toBeDefined();
    expect(cipherText).not.toBe(originalText);
    expect(typeof cipherText).toBe('string');

    const decryptedText = await decryptData(cipherText);
    expect(decryptedText).toBe(originalText);
    
    const parsed = JSON.parse(decryptedText);
    expect(parsed[0].name).toBe('مسألة إرث عائلية');
    expect(parsed[0].estate).toBe(500000);
  });

  it('should produce different ciphertext each time for the same plaintext due to random IV', async () => {
    const originalText = 'Identical Secret Data';
    
    const cipherText1 = await encryptData(originalText);
    const cipherText2 = await encryptData(originalText);
    
    expect(cipherText1).not.toBe(cipherText2);
    
    const decryptedText1 = await decryptData(cipherText1);
    const decryptedText2 = await decryptData(cipherText2);
    
    expect(decryptedText1).toBe(originalText);
    expect(decryptedText2).toBe(originalText);
  });

  it('should throw error on invalid base64 or altered ciphertext', async () => {
    await expect(decryptData('invalid-base64-text')).rejects.toThrow();
  });

  it('end-to-end saved cases persistence: encrypts to localStorage and decrypts back correctly', async () => {
    const mockStorage: Record<string, string> = {};
    const STORAGE_KEY = 'mawarith_saved_cases_v2';

    const savedCasesPayload = [
      {
        id: 'case-test-101',
        name: 'قضية حقيقية مشفرة',
        date: '2026-08-05',
        estate: 1000000,
        debts: 0,
        funeralCosts: 0,
        bequest: 0,
        deceasedGender: 'male' as const,
        stages: [],
      },
    ];

    // Save step
    const jsonToSave = JSON.stringify(savedCasesPayload);
    const encrypted = await encryptData(jsonToSave);
    mockStorage[STORAGE_KEY] = encrypted;

    // Verify stored item is NOT valid JSON when Base64-decoded directly
    const rawStored = mockStorage[STORAGE_KEY];
    expect(rawStored).toBeDefined();

    let directBase64DecodedJsonValid = false;
    try {
      const plainFromBase64 = atob(rawStored);
      JSON.parse(plainFromBase64);
      directBase64DecodedJsonValid = true;
    } catch {
      directBase64DecodedJsonValid = false;
    }
    expect(directBase64DecodedJsonValid).toBe(false);

    // Reload & Decrypt step
    const decryptedJson = await decryptData(mockStorage[STORAGE_KEY]);
    const restoredCases = JSON.parse(decryptedJson);
    expect(restoredCases).toHaveLength(1);
    expect(restoredCases[0].name).toBe('قضية حقيقية مشفرة');
    expect(restoredCases[0].estate).toBe(1000000);
  });
});
