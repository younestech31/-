import { OFFICE_INFO } from '../config';
import QRCode from 'qrcode';

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
  showDisclaimer?: boolean;      // Show disclaimer box or notary stamp
  documentRefNumber?: string;   // Unique document reference number
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
};

// Unified Arabic font family for all documents
export const EXPORT_FONT_FAMILY = 'Amiri';

// Shared office & legal content
export const EXPORT_OFFICE_INFO = {
  notaryNameAr: OFFICE_INFO.notaryFullName.ar,
  notaryNameFr: OFFICE_INFO.notaryFullName.fr,
  addressAr: 'حي العقيد لطفي، وهران',
  addressFr: "Cité Akid Lotfi, Oran",
  phone: OFFICE_INFO.phone.display,
  email: OFFICE_INFO.email,
  officialDesignationAr: OFFICE_INFO.officialDesignation.ar,
  titleAr: OFFICE_INFO.title.ar,
  legalBasisAr: OFFICE_INFO.legalBasis.ar,
  
  disclaimerTitleAr: 'تنبيه وإخلاء مسؤولية قانونية رسمية (منصة رقمية مساعدة وليست وسيلة إعلان):',
  disclaimerTextAr: 'إن العملية الحسابية والوثيقة المرفقة هي تصفية آلية استرشادية تقنية بحتة تم إعدادها لتوفير التسهيل والتدقيق النظري المسبق ولا يعتبر هذا الموقع أو مستخرجاته وسيلة دعاية أو إشهار بأي شكل من الأشكال. كما لا يمكن بأي حال من الأحوال أن تحل هذه الحاسبة محل الفريضة الشرعية الأصلية الموثقة رسمياً تحت مسؤولية الموثق لدى المحاكم والمجالس القضائية.',
  
  footerTextAr: 'العنوان: حي العقيد لطفي، وهران - مستخرج إلكتروني رسمي صادر من المنصة الرسمية',
  footerPageLabelAr: (page: number, total: number) => `الأستاذ الموثق لعطب محمد بوهران | صفحة ${page} من ${total}`,
} as const;

// Format currency as Algerian/French standard: 50.000.000,00 دج or 2.430.556,00 دج
export function formatDocumentCurrency(n: number, showCents = true): string {
  if (isNaN(n) || n === null || n === undefined) return '0,00 دج';
  const parts = Math.abs(n).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  const formatted = showCents ? `${intPart},${decPart}` : intPart;
  return n < 0 ? `-${formatted} دج` : `${formatted} دج`;
}

// Format percentage consistently
export function formatDocumentPercentage(p: number): string {
  if (isNaN(p) || p === null || p === undefined) return '0,00%';
  return `${p.toFixed(2).replace('.', ',')}%`;
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
export function EXPORT_FILENAME(name: string, ext: string, notaryName?: string): string {
  const cleanName = name.replace(/[\s\/:*?"<>|]+/g, '_') || 'تركة';
  const cleanNotary = notaryName ? notaryName.replace(/[\s\/:*?"<>|]+/g, '_') : 'Notaire_Lattab';
  const dateStr = new Date().toISOString().split('T')[0];
  return `${cleanNotary}_Succes_Faritha_${cleanName}_${dateStr}.${ext}`;
}
