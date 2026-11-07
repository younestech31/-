import { LICENSE_PUBLIC_KEY_SPKI } from './public-key';

export const LICENSE_STORAGE_KEY = 'mawarith_manual_license_v1';
export const INSTALLATION_ID_STORAGE_KEY = 'mawarith_installation_id_v1';
export const LICENSE_UPDATED_EVENT = 'mawarith:license-updated';

export const LICENSE_FEATURES = [
  'professional-exports',
  'office-branding',
  'professional-templates',
] as const;

export type LicenseFeature = (typeof LICENSE_FEATURES)[number];

export interface MawarithLicensePayload {
  formatVersion: 1;
  product: 'mawarith';
  licenseId: string;
  customerName: string;
  plan: 'professional';
  issuedAt: string;
  expiresAt: string;
  installationId: string;
  features: LicenseFeature[];
}

export interface MawarithLicenseEnvelope {
  formatVersion: 1;
  algorithm: 'ECDSA-P256-SHA256';
  payload: MawarithLicensePayload;
  signature: string;
}

export type LicenseFailureReason =
  | 'not_installed'
  | 'license_missing'
  | 'license_malformed'
  | 'public_key_missing'
  | 'signature_invalid'
  | 'wrong_product'
  | 'wrong_installation'
  | 'not_yet_valid'
  | 'expired'
  | 'storage_unavailable';

export interface LicenseStatus {
  isPaid: boolean;
  plan: 'free' | 'professional';
  installationId: string | null;
  license: MawarithLicensePayload | null;
  reason: LicenseFailureReason | null;
}

const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_LICENSE_BYTES = 32 * 1024;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Stable JSON encoding is shared with the offline Node.js issuer. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key =>
    `${JSON.stringify(key)}:${stableStringify(record[key])}`,
  ).join(',')}}`;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isLicensePayload(value: unknown): value is MawarithLicensePayload {
  if (!isRecord(value)) return false;
  if (
    value.formatVersion !== 1 ||
    value.product !== 'mawarith' ||
    value.plan !== 'professional' ||
    typeof value.licenseId !== 'string' ||
    value.licenseId.length < 8 ||
    value.licenseId.length > 100 ||
    typeof value.customerName !== 'string' ||
    value.customerName.trim().length < 2 ||
    value.customerName.length > 160 ||
    typeof value.installationId !== 'string' ||
    value.installationId.length < 16 ||
    value.installationId.length > 100 ||
    typeof value.issuedAt !== 'string' ||
    !ISO_DATE_PATTERN.test(value.issuedAt) ||
    typeof value.expiresAt !== 'string' ||
    !ISO_DATE_PATTERN.test(value.expiresAt) ||
    !Array.isArray(value.features) ||
    value.features.length === 0
  ) {
    return false;
  }

  const issuedAt = Date.parse(value.issuedAt);
  const expiresAt = Date.parse(value.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    return false;
  }

  const allowed = new Set<string>(LICENSE_FEATURES);
  return value.features.every(feature => typeof feature === 'string' && allowed.has(feature))
    && new Set(value.features).size === value.features.length;
}

export function parseLicenseEnvelope(input: unknown): MawarithLicenseEnvelope | null {
  if (!isRecord(input)) return null;
  if (
    input.formatVersion !== 1 ||
    input.algorithm !== 'ECDSA-P256-SHA256' ||
    !isLicensePayload(input.payload) ||
    typeof input.signature !== 'string' ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(input.signature)
  ) {
    return null;
  }
  return input as unknown as MawarithLicenseEnvelope;
}

/**
 * Verifies the envelope against an explicit SPKI key. The key parameter exists
 * to allow deterministic cryptographic tests; production callers use the
 * pinned public key through verifyLicenseEnvelope().
 */
export async function verifyLicenseEnvelopeWithKey(
  envelopeInput: unknown,
  installationId: string,
  publicKeySpkiBase64: string,
  now = Date.now(),
): Promise<LicenseStatus> {
  const base: LicenseStatus = {
    isPaid: false,
    plan: 'free',
    installationId,
    license: null,
    reason: null,
  };

  const envelope = parseLicenseEnvelope(envelopeInput);
  if (!envelope) return { ...base, reason: 'license_malformed' };

  const payload = envelope.payload;
  if (payload.product !== 'mawarith') return { ...base, reason: 'wrong_product' };
  if (payload.installationId !== installationId) return { ...base, reason: 'wrong_installation' };

  const issuedAt = Date.parse(payload.issuedAt);
  const expiresAt = Date.parse(payload.expiresAt);
  if (issuedAt > now + CLOCK_SKEW_MS) return { ...base, reason: 'not_yet_valid' };
  if (expiresAt <= now) return { ...base, reason: 'expired' };
  if (!publicKeySpkiBase64) return { ...base, reason: 'public_key_missing' };

  try {
    const publicKey = await crypto.subtle.importKey(
      'spki',
      decodeBase64(publicKeySpkiBase64),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const signature = decodeBase64(envelope.signature);
    const data = new TextEncoder().encode(stableStringify(payload));
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      data,
    );
    if (!valid) return { ...base, reason: 'signature_invalid' };

    return {
      isPaid: true,
      plan: 'professional',
      installationId,
      license: payload,
      reason: null,
    };
  } catch {
    return { ...base, reason: 'signature_invalid' };
  }
}

export async function verifyLicenseEnvelope(
  envelope: unknown,
  installationId: string,
  now = Date.now(),
): Promise<LicenseStatus> {
  return verifyLicenseEnvelopeWithKey(envelope, installationId, LICENSE_PUBLIC_KEY_SPKI, now);
}

/** Creates a stable random identifier for this browser installation. */
export function getOrCreateInstallationId(): string {
  if (typeof window === 'undefined') throw new Error('Installation IDs are only available in a browser.');
  const existing = window.localStorage.getItem(INSTALLATION_ID_STORAGE_KEY);
  if (existing && existing.length >= 16 && existing.length <= 100) return existing;

  if (!window.crypto?.getRandomValues) {
    throw new Error('تعذر إنشاء معرّف تثبيت آمن في هذا المتصفح.');
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  // RFC 4122 UUID v4 version and variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const installationId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  window.localStorage.setItem(INSTALLATION_ID_STORAGE_KEY, installationId);
  return installationId;
}

export async function getStoredLicenseStatus(): Promise<LicenseStatus> {
  if (typeof window === 'undefined') {
    return { isPaid: false, plan: 'free', installationId: null, license: null, reason: 'not_installed' };
  }

  let installationId: string;
  try {
    installationId = getOrCreateInstallationId();
  } catch {
    return { isPaid: false, plan: 'free', installationId: null, license: null, reason: 'storage_unavailable' };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(LICENSE_STORAGE_KEY);
  } catch {
    return { isPaid: false, plan: 'free', installationId, license: null, reason: 'storage_unavailable' };
  }
  if (!raw) {
    return { isPaid: false, plan: 'free', installationId, license: null, reason: 'license_missing' };
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_LICENSE_BYTES) {
    return { isPaid: false, plan: 'free', installationId, license: null, reason: 'license_malformed' };
  }

  try {
    return await verifyLicenseEnvelope(JSON.parse(raw), installationId);
  } catch {
    return { isPaid: false, plan: 'free', installationId, license: null, reason: 'license_malformed' };
  }
}

export async function activateLicenseFile(file: File): Promise<LicenseStatus> {
  if (file.size > MAX_LICENSE_BYTES) {
    throw new Error('ملف الترخيص أكبر من الحجم المسموح.');
  }
  const installationId = getOrCreateInstallationId();
  const raw = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ملف الترخيص ليس JSON صالحاً.');
  }

  const status = await verifyLicenseEnvelope(parsed, installationId);
  if (!status.isPaid) {
    const messages: Record<LicenseFailureReason, string> = {
      not_installed: 'التطبيق غير جاهز للتحقق من الترخيص.',
      license_missing: 'لم يتم العثور على ملف ترخيص.',
      license_malformed: 'صيغة ملف الترخيص غير صحيحة أو غير مدعومة.',
      public_key_missing: 'لم يتم إعداد مفتاح التحقق العام للتطبيق بعد.',
      signature_invalid: 'توقيع الترخيص غير صحيح. اطلب إصدار ملف جديد.',
      wrong_product: 'هذا الملف ليس ترخيصاً لبرنامج مواريث.',
      wrong_installation: 'هذا الترخيص صادر لتثبيت متصفح آخر. أرسل معرّف هذا التثبيت لطلب ترخيص مطابق.',
      not_yet_valid: 'لم يبدأ تاريخ صلاحية هذا الترخيص بعد.',
      expired: 'انتهت مدة هذا الترخيص. اطلب التجديد.',
      storage_unavailable: 'تعذر الوصول إلى التخزين المحلي في المتصفح.',
    };
    throw new Error(messages[status.reason || 'license_malformed']);
  }

  window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(parsed));
  window.dispatchEvent(new Event(LICENSE_UPDATED_EVENT));
  return status;
}

export function removeStoredLicense(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LICENSE_STORAGE_KEY);
  window.dispatchEvent(new Event(LICENSE_UPDATED_EVENT));
}
