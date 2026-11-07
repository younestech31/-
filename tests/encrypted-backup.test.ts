import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  decryptMawarithBackup,
  encryptMawarithBackup,
  MAWARITH_BACKUP_ITERATIONS,
  type MawarithBackupPayload,
} from '@/lib/backup/encrypted-backup';

const passphrase = 'Correct Horse Battery Staple 42!';
const payload: MawarithBackupPayload = {
  format: 'mawarith-backup',
  version: 1,
  exportedAt: '2026-11-07T12:00:00.000Z',
  cases: [
    {
      id: 'case-1',
      name: 'ملف تركة تجريبي',
      date: '2026-11-07',
      deceasedGender: 'male',
      estate: 250000,
      debts: 10000,
      funeralCosts: 5000,
      bequest: 0,
      stages: [{}],
      munasakhatStages: [{}],
    },
  ],
  officeSettings: {
    notaryNameAr: 'مكتب تجريبي',
    officialDesignationAr: 'بيانات المكتب',
    titleAr: '',
    addressAr: 'وهران',
    phone: '',
    email: '',
    isOfficialMode: false,
    showDisclaimer: true,
    exportLanguage: 'ar',
    digitFormat: 'western',
  },
};

let encryptedFile = '';

beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto);
  encryptedFile = await encryptMawarithBackup(payload, passphrase);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Mawarith encrypted offline backups', () => {
  it('round-trips saved cases and office settings with a password', async () => {
    const restored = await decryptMawarithBackup(encryptedFile, passphrase);
    expect(restored).toEqual(payload);
  });

  it('rejects a wrong password without returning any plaintext', async () => {
    await expect(decryptMawarithBackup(encryptedFile, 'Wrong Password 123!')).rejects.toThrow(
      'تعذر فك التشفير',
    );
  });

  it('rejects ciphertext tampering through AES-GCM authentication', async () => {
    const envelope = JSON.parse(encryptedFile) as { ciphertext: string };
    const replacement = envelope.ciphertext[0] === 'A' ? 'B' : 'A';
    envelope.ciphertext = replacement + envelope.ciphertext.slice(1);
    await expect(decryptMawarithBackup(JSON.stringify(envelope), passphrase)).rejects.toThrow(
      'تعذر فك التشفير',
    );
  });

  it('rejects altered or excessive KDF work factors before running PBKDF2', async () => {
    const envelope = JSON.parse(encryptedFile) as {
      kdf: { iterations: number };
    };
    envelope.kdf.iterations = MAWARITH_BACKUP_ITERATIONS + 1;
    await expect(decryptMawarithBackup(JSON.stringify(envelope), passphrase)).rejects.toThrow(
      'إعدادات تشفير النسخة الاحتياطية غير مدعومة',
    );
  });

  it('rejects weak passphrases and malformed backup structures', async () => {
    await expect(encryptMawarithBackup(payload, 'short')).rejects.toThrow('12 حرفاً على الأقل');
    await expect(decryptMawarithBackup('{bad json', passphrase)).rejects.toThrow('ليس JSON صالحاً');
    await expect(encryptMawarithBackup({
      ...payload,
      cases: [{ id: 'broken' }],
    }, passphrase)).rejects.toThrow('لا تطابق بنية مواريث');
  });
});
