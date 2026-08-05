import QRCode from 'qrcode';

export interface CalculationAuditRecord {
  auditId: string;
  inputHash: string;
  sharesHash: string;
  combinedHash: string;
  previousRecordHash?: string;
  registryVersion: string;
  timestamp: string;
  buildId: string;
  caseRef: string;
  summary: {
    estate: number;
    netEstate: number;
    heirCount: number;
    stagesCount: number;
  };
}

const REGISTRY_VERSION = '2026.1.0-ALGERIA-FAMILY-CODE-ARTS-139-180';
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dz-notary-build-2026';

/**
 * Computes a browser-native or Node SHA-256 hex string from arbitrary text.
 */
export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for Node / SSR context using crypto module
  try {
    const cryptoNode = await import('crypto');
    return cryptoNode.createHash('sha256').update(text).digest('hex');
  } catch {
    // Basic fallback hash for test environments where subtle crypto is mocked
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Generates a signed calculation audit record.
 */
export async function createCalculationAuditRecord(
  inputState: Record<string, unknown>,
  outputResults: unknown[],
  caseRef: string = 'REF-DZD-NOTARY',
  auditLedgerOptIn: boolean = false,
  previousRecordHash?: string
): Promise<CalculationAuditRecord> {
  const auditId = 'AUDIT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  const serializedInput = JSON.stringify(inputState);
  const serializedOutput = JSON.stringify(outputResults);

  const inputHash = await computeSha256(serializedInput);
  const sharesHash = await computeSha256(serializedOutput);

  const prevHash = previousRecordHash || 'GENESIS';
  const combinedPayload = `${inputHash}:${sharesHash}:${REGISTRY_VERSION}:${timestamp}:${BUILD_ID}:${caseRef}:${prevHash}`;
  const combinedHash = await computeSha256(combinedPayload);

  let estate = 0;
  let netEstate = 0;
  if (typeof inputState.estate === 'number') estate = inputState.estate;
  if (typeof inputState.netEstate === 'number') netEstate = inputState.netEstate;

  const record: CalculationAuditRecord = {
    auditId,
    inputHash,
    sharesHash,
    combinedHash,
    previousRecordHash: prevHash,
    registryVersion: REGISTRY_VERSION,
    timestamp,
    buildId: BUILD_ID,
    caseRef,
    summary: {
      estate,
      netEstate,
      heirCount: outputResults.length,
      stagesCount: Array.isArray(inputState.stages) ? inputState.stages.length : 1,
    }
  };

  // Asynchronously store in client IndexedDB if in browser
  if (typeof window !== 'undefined') {
    saveAuditRecordToIndexedDB(record).catch(err => console.warn('IndexedDB audit save warning:', err));

    if (auditLedgerOptIn) {
      fetch('/api/audit-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combinedHash: record.combinedHash,
          previousRecordHash: record.previousRecordHash,
          auditId: record.auditId,
          registryVersion: record.registryVersion,
          timestamp: record.timestamp,
          buildId: record.buildId,
          summary: record.summary,
        }),
      }).catch(err => console.warn('Server audit ledger sync warning:', err));
    }
  }

  return record;
}

/**
 * Generates a QR Code Data URL embedding offline verification data & verification URL.
 */
export async function generateAuditQRCodeDataUrl(record: CalculationAuditRecord): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://notaire-lattab.dz';
  const verifyUrl = `${origin}/verify?hash=${record.combinedHash}&ref=${encodeURIComponent(record.caseRef)}&id=${record.auditId}`;

  const qrPayload = JSON.stringify({
    url: verifyUrl,
    hash: record.combinedHash,
    ref: record.caseRef,
    ts: record.timestamp,
    reg: record.registryVersion,
  });

  try {
    return await QRCode.toDataURL(qrPayload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#1F3D2E',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate Audit QR Code Data URL:', err);
    return '';
  }
}

/**
 * Client-Side IndexedDB Storage for Calculation Audit Trail (Zero Server Transmission)
 */
const DB_NAME = 'NotaireLattab_AuditTrailDB';
const DB_VERSION = 1;
const STORE_NAME = 'calculation_audits';

function openAuditDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'combinedHash' });
        store.createIndex('auditId', 'auditId', { unique: false });
        store.createIndex('caseRef', 'caseRef', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAuditRecordToIndexedDB(record: CalculationAuditRecord): Promise<void> {
  try {
    const db = await openAuditDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save audit record to IndexedDB:', err);
  }
}

export async function getAuditRecordFromIndexedDB(combinedHash: string): Promise<CalculationAuditRecord | null> {
  try {
    const db = await openAuditDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(combinedHash);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not retrieve audit record from IndexedDB:', err);
    return null;
  }
}

export async function getAllAuditRecordsFromIndexedDB(): Promise<CalculationAuditRecord[]> {
  try {
    const db = await openAuditDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not list audit records from IndexedDB:', err);
    return [];
  }
}

/**
 * Offline Verification Engine: Validates input/output hash integrity against recorded combined hash.
 */
export async function verifyAuditIntegrity(
  inputState: Record<string, unknown>,
  outputResults: unknown[],
  expectedCombinedHash: string,
  timestamp: string,
  caseRef: string,
  previousRecordHash?: string
): Promise<{ isValid: boolean; computedHash: string; details: string }> {
  const serializedInput = JSON.stringify(inputState);
  const serializedOutput = JSON.stringify(outputResults);

  const inputHash = await computeSha256(serializedInput);
  const sharesHash = await computeSha256(serializedOutput);

  const prevHash = previousRecordHash || 'GENESIS';
  const combinedPayload = `${inputHash}:${sharesHash}:${REGISTRY_VERSION}:${timestamp}:${BUILD_ID}:${caseRef}:${prevHash}`;
  const computedHashWithPrev = await computeSha256(combinedPayload);

  // Fallback check without previousRecordHash for backwards compatibility
  const combinedPayloadLegacy = `${inputHash}:${sharesHash}:${REGISTRY_VERSION}:${timestamp}:${BUILD_ID}:${caseRef}`;
  const computedHashLegacy = await computeSha256(combinedPayloadLegacy);

  const isValid = computedHashWithPrev === expectedCombinedHash || computedHashLegacy === expectedCombinedHash;
  const computedHash = computedHashWithPrev === expectedCombinedHash ? computedHashWithPrev : computedHashLegacy;

  const details = isValid
    ? 'لم يتم تعديل الأرقام يدوياً بعد إصدار الوثيقة. ملاحظة هامة: هذا التحقق لا يثبت صحة التطبيق الشرعي للحساب، بل فقط عدم تعديله يدوياً بعد الإصدار.'
    : 'تنبيه: البصمة الرقمية غير مطابقة! هناك احتمال بتعديل القيم الحسابية أو الورثة يدوياً بعد الإصدار.';

  return { isValid, computedHash, details };
}
