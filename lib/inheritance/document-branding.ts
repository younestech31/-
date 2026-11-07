import { OFFICE_INFO } from '../config';
import QRCode from 'qrcode';
import { formatBilingualDate } from '../datetime/hijri';
import { CalculationAuditRecord } from './calculation-audit';

/**
 * Unified, professional color palette for inheritance exports.
 * Standardized on standard #RRGGBB hex values.
 */
export const COLOR_PALETTE = {
  green: '#1F3D2E',       // Primary Brand green (Ink Green)
  greenDark: '#12201A',   // Deep brand green (Black-green Ink)
  greenLight: '#EFE8D8',  // Light Parchment Background
  white: '#FFFFFF',       // Pure white
  red: '#B91C1C',         // Blocked/Alert red
  redLight: '#FEF2F2',    // Light red background
  amber: '#B8894A',       // Secondary Brass/Nuhasi
  amberLight: '#FFFBEB',  // Light amber background
  slateLight: '#F8FAFC',  // Table stripe slate light
  mint: '#C9D3C4',        // Calm light green
  awlBg: '#FFF3E0',       // Awl notice background (orange tint)
  raddBg: '#E3F2FD',      // Radd notice background (unified blue tint)
  treasuryBg: '#EFF6FF',  // Treasury row background (light blue)
  bequestRow: '#FFF8E1',  // Bequest row background (warm amber)
  blockedRow: '#FEF2F2',  // Blocked row background (soft red)
  border: '#D1D5DB',      // Border grey
  mutedText: '#64748B',   // Muted gray text
} as const;

// Color converter helpers
export function toCanvasHex(color: string): string {
  return color;
}

export function toDocxHex(color: string): string {
  return color.replace('#', '');
}

export function toExcelArgb(color: string): string {
  return 'FF' + color.replace('#', '');
}

export interface OfficeSettings {
  notaryNameAr: string;
  officialDesignationAr: string;
  titleAr: string;
  addressAr: string;
  phone: string;
  email: string;
  isOfficialMode?: boolean;      // Toggle for Official Notary Document Mode
  notaryLicenseVerified?: boolean; // Verified notary license check
  showDisclaimer?: boolean;      // Show disclaimer box or notary stamp
  documentRefNumber?: string;    // Unique document reference number
  exportLanguage?: 'ar' | 'fr';  // Language toggle for export documents
  digitFormat?: 'western' | 'arabic-indic'; // Numeral formatting toggle
  auditLedgerOptIn?: boolean;   // Opt-in toggle for server-side audit ledger
  cloudSyncPassphrase?: string;  // Session-only passphrase; never persist this field
}

/** Return office settings safe to persist; the cloud passphrase is memory-only. */
export function getPersistedOfficeSettings(
  settings: OfficeSettings
): Omit<OfficeSettings, 'cloudSyncPassphrase'> {
  const persisted = { ...settings };
  delete persisted.cloudSyncPassphrase;
  return persisted;
}

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = {
  notaryNameAr: 'الأستاذ لعطب محمد',
  officialDesignationAr: 'الديوان العمومي للتوثيق',
  titleAr: 'موثق لدى محكمة فلاوسن — ولاية وهران',
  addressAr: 'حي العقيد لطفي، وهران',
  phone: '+213 562 29 69 81',
  email: 'maitrelattabmohamed@gmail.com',
  isOfficialMode: false,
  showDisclaimer: true,
  documentRefNumber: '',
  exportLanguage: 'ar',
  digitFormat: 'western',
  auditLedgerOptIn: false,
};

// Unified Arabic font family for all documents
export const EXPORT_FONT_FAMILY = 'Amiri';

// Shared office & legal content
export const EXPORT_OFFICE_INFO = {
  notaryNameAr: OFFICE_INFO.notaryFullName,
  addressAr: 'حي العقيد لطفي، وهران',
  phone: OFFICE_INFO.phone.display,
  email: OFFICE_INFO.email,
  officialDesignationAr: OFFICE_INFO.officialDesignation,
  titleAr: OFFICE_INFO.title,
  legalBasisAr: OFFICE_INFO.legalBasis,
  
  disclaimerTitleAr: 'تنبيه وإخلاء مسؤولية قانونية رسمية (منصة رقمية مساعدة وليست وسيلة إعلان):',
  disclaimerTextAr: 'إن العملية الحسابية والوثيقة المرفقة هي تصفية آلية استرشادية تقنية بحتة تم إعدادها لتوفير التسهيل والتدقيق النظري المسبق ولا يعتبر هذا الموقع أو مستخرجاته وسيلة دعاية أو إشهار بأي شكل من الأشكال. كما لا يمكن بأي حال من الأحوال أن تحل هذه الحاسبة محل الفريضة الشرعية الأصلية الموثقة رسمياً تحت مسؤولية الموثق لدى المحاكم والمجالس القضائية.',
  
  footerTextAr: 'العنوان: حي العقيد لطفي، وهران - مستخرج إلكتروني رسمي صادر من المنصة الرسمية',
  footerPageLabelAr: (page: number, total: number) => `الأستاذ الموثق لعطب محمد بوهران | صفحة ${page} من ${total}`,
} as const;

/**
 * Converts Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
 */
export function toArabicIndicDigits(str: string): string {
  const westernToIndic: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return String(str).replace(/[0-9]/g, w => westernToIndic[w] || w);
}

/**
 * Formats currency as Algerian/French standard with numeral option:
 * e.g. 50.000.000,00 دج or 50.000.000,00 DZD
 */
export function formatDocumentCurrency(
  n: number,
  showCents = true,
  digitFormat: 'western' | 'arabic-indic' = 'western',
  lang: 'ar' | 'fr' = 'ar'
): string {
  if (isNaN(n) || n === null || n === undefined) {
    const zeroStr = lang === 'fr' ? '0,00 DZD' : '0,00 دج';
    return digitFormat === 'arabic-indic' ? toArabicIndicDigits(zeroStr) : zeroStr;
  }
  const parts = Math.abs(n).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  const unit = lang === 'fr' ? 'DZD' : 'دج';
  const formatted = showCents ? `${intPart},${decPart} ${unit}` : `${intPart} ${unit}`;
  const finalStr = n < 0 ? `-${formatted}` : formatted;

  return digitFormat === 'arabic-indic' ? toArabicIndicDigits(finalStr) : finalStr;
}

/**
 * Unified helper for formatting currency amounts across interactive UI and exported documents.
 * Defaults to Western digits with Algerian grouping (e.g., 1.234.567) or Arabic-Indic digits (١.٢٣٤.٥٦٧).
 */
export function formatDZDAmount(
  amount: number,
  digitStyle: 'western' | 'arabic-indic' = 'western',
  includeCurrencySymbol: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    const zeroVal = '0';
    const formattedZero = digitStyle === 'arabic-indic' ? toArabicIndicDigits(zeroVal) : zeroVal;
    return includeCurrencySymbol ? `${formattedZero} دج` : formattedZero;
  }
  const hasCents = amount % 1 !== 0;
  const formatted = formatDocumentCurrency(amount, hasCents, digitStyle, 'ar');
  if (includeCurrencySymbol) {
    return formatted;
  }
  return formatted.replace(/ دج$/, '').trim();
}

// Format percentage consistently
export function formatDocumentPercentage(
  p: number,
  digitFormat: 'western' | 'arabic-indic' = 'western'
): string {
  if (isNaN(p) || p === null || p === undefined) return digitFormat === 'arabic-indic' ? '٠,٠٠%' : '0,00%';
  const str = `${p.toFixed(2).replace('.', ',')}%`;
  return digitFormat === 'arabic-indic' ? toArabicIndicDigits(str) : str;
}

// Generate unique Document Reference Number
export function generateDocumentRefNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REF: DZD-MWR-${year}-${random}`;
}

// Generate QR Code data URL
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 150,
      margin: 1,
      color: {
        dark: '#1F3D2E',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

// Standard Excel Custom Number Format for Currency
export const EXPORT_EXCEL_NUM_FMT = '#,##0.00" دج"';

// Unified 7-Table Columns
export const EXPORT_TABLE_COLUMNS = [
  { key: 'name', label: 'الوارث' },
  { key: 'role', label: 'صفة الإرث والسبب' },
  { key: 'share', label: 'النصيب الشرعي' },
  { key: 'parts', label: 'السهام' },
  { key: 'percentage', label: 'النسبة (%)' },
  { key: 'amount', label: 'المبلغ المستحق (دج)' },
  { key: 'article', label: 'السند القانوني' },
] as const;

// Canonical filename patterns
export function EXPORT_FILENAME(name: string, ext: string, notaryName?: string, lang: 'ar' | 'fr' = 'ar'): string {
  const cleanName = name.replace(/[\s\/:*?"<>|]+/g, '_') || (lang === 'fr' ? 'Succession' : 'تركة');
  const cleanNotary = notaryName ? notaryName.replace(/[\s\/:*?"<>|]+/g, '_') : 'Notaire_Lattab';
  const dateStr = new Date().toISOString().split('T')[0];
  return `${cleanNotary}_Succes_Faritha_${cleanName}_${lang.toUpperCase()}_${dateStr}.${ext}`;
}

/**
 * Notarial Attestation Block Content Generator
 */
export interface NotarialAttestationBlockData {
  title: string;
  attestationText: string;
  notaryName: string;
  caseRef: string;
  formattedDate: string;
  auditHash: string;
  auditQrUrl?: string;
  signatureBoxTitle: string;
}

export function getNotarialAttestationData(
  settings: OfficeSettings,
  auditRecord?: CalculationAuditRecord | null,
  lang: 'ar' | 'fr' = 'ar'
): NotarialAttestationBlockData {
  const caseRef = settings.documentRefNumber || auditRecord?.caseRef || generateDocumentRefNumber();
  const dateStr = formatBilingualDate(new Date(), lang);
  const auditHash = auditRecord?.combinedHash || 'SHA256-PENDING-NOTARIAL-SEAL';
  const isVerified = Boolean(settings.notaryLicenseVerified);

  if (lang === 'fr') {
    if (isVerified) {
      return {
        title: 'ATTESTATION DE CONFORMITÉ ET VÉRIFICATION CRYPTOGRAPHIQUE',
        attestationText: `Je soussigné, ${settings.notaryNameAr || 'Maître Notaire'}, titulaire de l'office notarial, certifie la conformité légale des calculs de dévolution successorale ci-dessus établis conformément aux Articles 139 à 180 du Code de la Famille Algérien. Le présent acte comporte une empreinte numérique SHA-256 infalsifiable vérifiable en scannant le code QR ci-contre.`,
        notaryName: settings.notaryNameAr || 'Maître Lattab Mohamed - Notaire',
        caseRef: `Réf. Acte: ${caseRef}`,
        formattedDate: `Date d'établissement: ${dateStr}`,
        auditHash,
        signatureBoxTitle: 'Sceau et Signature du Notaire',
      };
    } else {
      return {
        title: 'RAPPORT DE CALCUL ET VÉRIFICATION CRYPTOGRAPHIQUE (SHA-256)',
        attestationText: `Calcul de dévolution successorale établi via la plateforme Mawarith conformément aux Articles 139 à 180 du Code de la Famille Algérien. Le code de vérification (SHA-256) garantit l'intégrité technique des calculs.`,
        notaryName: settings.notaryNameAr || 'Plateforme Mawarith',
        caseRef: `Réf. Acte: ${caseRef}`,
        formattedDate: `Date d'établissement: ${dateStr}`,
        auditHash,
        signatureBoxTitle: 'Aperçu du rapport technique',
      };
    }
  } else {
    if (isVerified) {
      return {
        title: 'إشهاد المصادقة التوثيقية ورمز التحقق التشفيري (SHA-256)',
        attestationText: `أشهد أنا الموثق الموقّع أدناه، صاحب الديوان العمومي للتوثيق، بصحة ومطابقة عملية تصفية التركة المرفقة للأنصبة الشرعية والمواد 139 إلى 180 من قانون الأسرة الجزائري. تحمل هذه الوثيقة رمز تحقق تشفيري بـ SHA-256 لمنع أي تغيير يدوياً في السهام.`,
        notaryName: settings.notaryNameAr || 'الأستاذ لعطب محمد — موثق',
        caseRef: `رقم مرجع الفريضة: ${caseRef}`,
        formattedDate: `تاريخ التحرير والإشهاد: ${dateStr}`,
        auditHash,
        signatureBoxTitle: 'توقيع وخاتم الموثق',
      };
    } else {
      return {
        title: 'تقرير التصفية الآلية ورمز التحقق التشفيري (SHA-256)',
        attestationText: `تم إعداد هذا الحساب باستخدام منصة مواريث بالحاسبة الفقهية الآلية وفق المواد 139 إلى 180 من قانون الأسرة الجزائري. رمز التحقق التشفيري المرفق (SHA-256) يُستخدم للتحقق التقني من تكامل الحسابات وعدم تعديلها.`,
        notaryName: settings.notaryNameAr || 'منصة مواريث الرقمية',
        caseRef: `رقم مرجع الفريضة: ${caseRef}`,
        formattedDate: `تاريخ التحرير والإشهاد: ${dateStr}`,
        auditHash,
        signatureBoxTitle: 'معاينة المستخرج التقني',
      };
    }
  }
}
