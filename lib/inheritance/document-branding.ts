import { OFFICE_INFO } from '../config';

/**
 * Unified, professional color palette for inheritance exports.
 * Standardized on standard #RRGGBB hex values.
 * 
 * Note on disagreements/merging:
 * - raddBg: Word used 'EFF6FF' (light blue) and Excel used 'E3F2FD' (slate blue-ish).
 *   We resolved this by unifying on '#E3F2FD' for a cleaner slate/blue tint.
 * - border: Excel had 'D1D5DB' (grey border), which we preserved as '#D1D5DB'.
 * - treasuryBg: Preserved as '#EFF6FF'.
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
  return color; // e.g. "#0A5D38"
}

export function toDocxHex(color: string): string {
  return color.replace('#', ''); // e.g. "0A5D38"
}

export function toExcelArgb(color: string): string {
  return 'FF' + color.replace('#', ''); // e.g. "FF0A5D38"
}

export interface OfficeSettings {
  notaryNameAr: string;
  officialDesignationAr: string;
  titleAr: string;
  addressAr: string;
  phone: string;
  email: string;
  isOfficialMode?: boolean; // Official Notary Certified Export Mode (إصدار محرر رسمي للتوثيق)
}

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = {
  notaryNameAr: 'الأستاذ لعطب محمد',
  officialDesignationAr: 'الديوان العمومي للتوثيق',
  titleAr: 'موثق لدى محكمة فلاوسن — ولاية وهران',
  addressAr: 'حي العقيد لطفي، وهران',
  phone: '+213 562 29 69 81',
  email: 'maitrelattabmohamed@gmail.com',
  isOfficialMode: true,
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

// Canonical currency formatter (e.g. "2.430.556,00 دج" or "2.430.556 دج")
export function formatDocumentCurrency(n: number, includeDecimals: boolean = true): string {
  if (n === null || n === undefined || isNaN(n)) return '0,00 دج';
  
  if (!includeDecimals) {
    const intStr = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intStr} دج`;
  }
  
  const parts = n.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${parts[1]} دج`;
}

// Standard Excel Custom Number Format for Currency
export const EXPORT_EXCEL_NUM_FMT = '#,##0" دج"';

// Unified Table Columns
export const EXPORT_TABLE_COLUMNS = [
  { key: 'name', label: 'الوارث' },
  { key: 'role', label: 'صفة الإرث' },
  { key: 'share', label: 'النصيب (كسر)' },
  { key: 'parts', label: 'السهام' },
  { key: 'amount', label: 'المبلغ المستحق', labelPure: 'النسبة مئوية' },
  { key: 'article', label: 'المادة القانونية' },
] as const;

// Canonical filename patterns
export function EXPORT_FILENAME(name: string, ext: string, notaryName?: string): string {
  const cleanName = name.replace(/[\s\/:*?"<>|]+/g, '_') || 'تركة';
  const cleanNotary = notaryName ? notaryName.replace(/[\s\/:*?"<>|]+/g, '_') : 'Notaire_Lattab';
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${cleanNotary}_Succes_Faritha_${cleanName}_${dateStr}.${ext}`;
}
