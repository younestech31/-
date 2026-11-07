/**
 * Password-protected, offline Mawarith backup format.
 *
 * PBKDF2-HMAC-SHA-256 derives a non-extractable AES-256-GCM key locally.
 * The password, salt, IV, and ciphertext never leave the browser.
 */
export const MAWARITH_BACKUP_FORMAT = 'mawarith-encrypted-backup' as const;
export const MAWARITH_BACKUP_VERSION = 1 as const;
export const MAWARITH_BACKUP_ITERATIONS = 600_000;
export const MAWARITH_BACKUP_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAWARITH_BACKUP_MIN_PASSPHRASE_CHARS = 12;
export const MAWARITH_BACKUP_MAX_PASSPHRASE_BYTES = 1024;
const MAX_BACKUP_CASES = 5_000;
const MAX_BACKUP_PLAINTEXT_BYTES = 20 * 1024 * 1024;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BITS = 128;
const AAD = new TextEncoder().encode(
  'MAWARITH|ENCRYPTED-BACKUP|V1|PBKDF2-HMAC-SHA-256|600000|AES-256-GCM',
);

export interface MawarithBackupPayload {
  format: 'mawarith-backup';
  version: 1;
  exportedAt: string;
  cases: unknown[];
  officeSettings: unknown;
}

interface EncryptedBackupEnvelope {
  format: typeof MAWARITH_BACKUP_FORMAT;
  version: typeof MAWARITH_BACKUP_VERSION;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: typeof MAWARITH_BACKUP_ITERATIONS;
  };
  cipher: {
    name: 'AES-GCM';
    keyLength: 256;
    tagLength: typeof TAG_BITS;
  };
  salt: string;
  iv: string;
  ciphertext: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSavedCase(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const stages = Array.isArray(value.stages)
    ? value.stages
    : value.munasakhatStages;
  return (
    typeof value.id === 'string' && value.id.length >= 1 && value.id.length <= 200 &&
    typeof value.name === 'string' && value.name.trim().length >= 1 && value.name.length <= 200 &&
    typeof value.date === 'string' && value.date.length >= 1 && value.date.length <= 100 &&
    (value.deceasedGender === null || value.deceasedGender === 'male' || value.deceasedGender === 'female') &&
    ['estate', 'debts', 'funeralCosts', 'bequest'].every(key =>
      typeof value[key] === 'number' && Number.isFinite(value[key]),
    ) &&
    Array.isArray(stages) && stages.length <= 500 &&
    stages.every(stage => isRecord(stage))
  );
}

function isValidOfficeSettings(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const requiredStrings = [
    'notaryNameAr', 'officialDesignationAr', 'titleAr', 'addressAr', 'phone', 'email',
  ];
  if (!requiredStrings.every(key => typeof value[key] === 'string' && (value[key] as string).length <= 500)) {
    return false;
  }
  if (value.isOfficialMode !== undefined && typeof value.isOfficialMode !== 'boolean') return false;
  if (value.notaryLicenseVerified !== undefined && typeof value.notaryLicenseVerified !== 'boolean') return false;
  if (value.showDisclaimer !== undefined && typeof value.showDisclaimer !== 'boolean') return false;
  if (value.exportLanguage !== undefined && value.exportLanguage !== 'ar' && value.exportLanguage !== 'fr') return false;
  if (value.digitFormat !== undefined && value.digitFormat !== 'western' && value.digitFormat !== 'arabic-indic') return false;
  if (value.documentRefNumber !== undefined && (typeof value.documentRefNumber !== 'string' || value.documentRefNumber.length > 500)) return false;
  return true;
}

export function isMawarithBackupPayload(value: unknown): value is MawarithBackupPayload {
  return (
    isRecord(value) &&
    value.format === 'mawarith-backup' &&
    value.version === 1 &&
    typeof value.exportedAt === 'string' &&
    Number.isFinite(Date.parse(value.exportedAt)) &&
    Array.isArray(value.cases) &&
    value.cases.length <= MAX_BACKUP_CASES &&
    value.cases.every(isValidSavedCase) &&
    isValidOfficeSettings(value.officeSettings)
  );
}

function validatePassphrase(passphrase: string): Uint8Array {
  if (typeof passphrase !== 'string') {
    throw new Error('أدخل كلمة مرور للنسخة الاحتياطية.');
  }
  const characters = Array.from(passphrase).length;
  const bytes = new TextEncoder().encode(passphrase);
  if (characters < MAWARITH_BACKUP_MIN_PASSPHRASE_CHARS) {
    throw new Error('كلمة المرور قصيرة جداً. استخدم 12 حرفاً على الأقل.');
  }
  if (bytes.byteLength > MAWARITH_BACKUP_MAX_PASSPHRASE_BYTES) {
    throw new Error('كلمة المرور طويلة جداً.');
  }
  return bytes;
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('التشفير الآمن غير متاح في هذا المتصفح أو سياق التشغيل.');
  }
  return globalThis.crypto;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value: unknown, expectedLength?: number): Uint8Array {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAWARITH_BACKUP_MAX_FILE_BYTES * 2 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    throw new Error('صيغة ملف النسخة الاحتياطية غير صالحة.');
  }
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error('تعذر قراءة البيانات المشفّرة في الملف.');
  }
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  if (expectedLength !== undefined && bytes.byteLength !== expectedLength) {
    throw new Error('بنية ملف النسخة الاحتياطية غير صالحة.');
  }
  if (encodeBase64(bytes) !== value) {
    throw new Error('ترميز ملف النسخة الاحتياطية غير قياسي.');
  }
  return bytes;
}

async function deriveBackupKey(passphraseBytes: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoApi = getCrypto();
  const material = await cryptoApi.subtle.importKey(
    'raw',
    new Uint8Array(passphraseBytes).buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt).buffer as ArrayBuffer,
      iterations: MAWARITH_BACKUP_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptMawarithBackup(
  payload: MawarithBackupPayload,
  passphrase: string,
): Promise<string> {
  if (!isMawarithBackupPayload(payload)) {
    throw new Error('بيانات النسخة الاحتياطية لا تطابق بنية مواريث المعتمدة.');
  }
  const passwordBytes = validatePassphrase(passphrase);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  if (plaintext.byteLength > MAX_BACKUP_PLAINTEXT_BYTES) {
    throw new Error('حجم البيانات أكبر من الحد المسموح للنسخة الاحتياطية المشفّرة.');
  }

  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveBackupKey(passwordBytes, salt);
  const ciphertext = new Uint8Array(await cryptoApi.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv).buffer as ArrayBuffer,
      additionalData: new Uint8Array(AAD).buffer as ArrayBuffer,
      tagLength: TAG_BITS,
    },
    key,
    plaintext.buffer as ArrayBuffer,
  ));

  const envelope: EncryptedBackupEnvelope = {
    format: MAWARITH_BACKUP_FORMAT,
    version: MAWARITH_BACKUP_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: MAWARITH_BACKUP_ITERATIONS },
    cipher: { name: 'AES-GCM', keyLength: 256, tagLength: TAG_BITS },
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(ciphertext),
  };
  const serialized = JSON.stringify(envelope, null, 2) + '\n';
  if (new TextEncoder().encode(serialized).byteLength > MAWARITH_BACKUP_MAX_FILE_BYTES) {
    throw new Error('حجم ملف النسخة الاحتياطية المشفّرة تجاوز الحد المسموح.');
  }
  return serialized;
}

export async function decryptMawarithBackup(
  serialized: string,
  passphrase: string,
): Promise<MawarithBackupPayload> {
  if (
    typeof serialized !== 'string' ||
    new TextEncoder().encode(serialized).byteLength > MAWARITH_BACKUP_MAX_FILE_BYTES
  ) {
    throw new Error('حجم ملف النسخة الاحتياطية غير صالح أو أكبر من الحد المسموح.');
  }
  const passwordBytes = validatePassphrase(passphrase);
  let envelope: unknown;
  try {
    envelope = JSON.parse(serialized);
  } catch {
    throw new Error('ملف النسخة الاحتياطية ليس JSON صالحاً.');
  }
  if (!isRecord(envelope) || !isRecord(envelope.kdf) || !isRecord(envelope.cipher)) {
    throw new Error('صيغة ملف النسخة الاحتياطية غير مدعومة.');
  }
  if (
    envelope.format !== MAWARITH_BACKUP_FORMAT ||
    envelope.version !== MAWARITH_BACKUP_VERSION ||
    envelope.kdf.name !== 'PBKDF2' ||
    envelope.kdf.hash !== 'SHA-256' ||
    envelope.kdf.iterations !== MAWARITH_BACKUP_ITERATIONS ||
    envelope.cipher.name !== 'AES-GCM' ||
    envelope.cipher.keyLength !== 256 ||
    envelope.cipher.tagLength !== TAG_BITS
  ) {
    throw new Error('إصدار أو إعدادات تشفير النسخة الاحتياطية غير مدعومة.');
  }

  const salt = decodeBase64(envelope.salt, SALT_BYTES);
  const iv = decodeBase64(envelope.iv, IV_BYTES);
  const ciphertext = decodeBase64(envelope.ciphertext);
  if (ciphertext.byteLength < TAG_BITS / 8 || ciphertext.byteLength > MAX_BACKUP_PLAINTEXT_BYTES + TAG_BITS / 8) {
    throw new Error('حجم المحتوى المشفّر داخل الملف غير صالح.');
  }

  let plaintextBuffer: ArrayBuffer;
  try {
    const key = await deriveBackupKey(passwordBytes, salt);
    plaintextBuffer = await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv).buffer as ArrayBuffer,
        additionalData: new Uint8Array(AAD).buffer as ArrayBuffer,
        tagLength: TAG_BITS,
      },
      key,
      ciphertext.buffer as ArrayBuffer,
    );
  } catch {
    throw new Error('تعذر فك التشفير. تحقق من كلمة المرور وسلامة ملف النسخة الاحتياطية.');
  }

  let payload: unknown;
  try {
    const plaintext = new TextDecoder('utf-8', { fatal: true }).decode(plaintextBuffer);
    payload = JSON.parse(plaintext);
  } catch {
    throw new Error('المحتوى بعد فك التشفير ليس بيانات مواريث صالحة.');
  }
  if (!isMawarithBackupPayload(payload)) {
    throw new Error('بيانات النسخة الاحتياطية تالفة أو لا تطابق إصدار مواريث المدعوم.');
  }
  return payload;
}
