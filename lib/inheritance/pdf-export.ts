import { jsPDF } from 'jspdf';
import { StageResult } from '@/components/inheritance/ResultsTable';
import Fraction from 'fraction.js';
import { ArabicShaper } from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();
import {
  COLOR_PALETTE,
  EXPORT_OFFICE_INFO,
  formatDocumentCurrency,
  EXPORT_TABLE_COLUMNS,
  EXPORT_FILENAME,
  OfficeSettings,
  DEFAULT_OFFICE_SETTINGS,
  generateDocumentRefNumber,
  generateQRCodeDataUrl
} from './document-branding';

const formatCurrency = formatDocumentCurrency;

function deceasedPronoun(gender: 'male' | 'female' | null): string {
  return gender === 'female' ? 'المرحومة' : 'المرحوم';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function safeSetFont(pdf: jsPDF, fontName: string, style: string = 'normal'): void {
  try {
    pdf.setFont(fontName, style);
    pdf.getTextWidth('a');
  } catch (err) {
    console.warn(`Font ${fontName} (${style}) is not fully registered. Falling back to normal style...`, err);
    try {
      pdf.setFont(fontName, 'normal');
      pdf.getTextWidth('a');
    } catch (err2) {
      console.warn(`Fallback to ${fontName} normal failed. Using helvetica normal...`, err2);
      try {
        pdf.setFont('helvetica', 'normal');
      } catch {
        // No-op absolute fallback
      }
    }
  }
}

/**
 * Prepares text for native jsPDF vector rendering:
 * 1. Isolates embedded non-Arabic script runs (e.g. Latin custom names) in First-Strong-Isolate marks (\u2066...\u2069).
 * 2. Shapes Arabic characters using ArabicShaper into visual glyphs without modifying Latin runs.
 * 3. Runs Unicode Bidi Algorithm via bidi-js for proper RTL/LTR character reordering.
 */
export function fixArabicRtl(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!str.trim()) return '';

  // Isolate embedded runs of non-Arabic script (Latin letters, accents, numbers)
  const isolated = str.replace(/([A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF0-9\s.\-]*[A-Za-z\u00C0-\u00FF0-9])/g, '\u2066$1\u2069');

  // Shape Arabic letters into visual glyph forms
  const reshaped = ArabicShaper.convertArabic(isolated);

  // Apply Unicode Bidi reordering if string contains Arabic/RTL characters
  if (/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(reshaped)) {
    const levels = bidi.getEmbeddingLevels(reshaped);
    return bidi.getReorderedString(reshaped, levels);
  }

  return reshaped;
}

/**
 * Wraps text into multiple lines given a maximum width in millimeters for jsPDF.
 */
function wrapArabicText(pdf: jsPDF, text: string, maxWidthMm: number): string[] {
  if (!text) return [''];
  const words = String(text).split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    const testLineRtl = fixArabicRtl(testLine);
    
    let width = 0;
    try {
      width = pdf.getTextWidth(testLineRtl);
    } catch (err) {
      console.warn('pdf.getTextWidth crashed in wrapArabicText, falling back to safe font and measuring...', err);
      try {
        pdf.setFont('helvetica', 'normal');
        width = pdf.getTextWidth(testLineRtl);
      } catch {
        // Ultimate rough character width estimation if all fails
        width = testLineRtl.length * 2.2;
      }
    }

    if (width > maxWidthMm && i > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws a native vector table cell with background fill, border, and vertically centered vector text.
 */
function drawVectorCell(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    fillColor?: string | null;
    strokeColor?: string | null;
    textColor?: string;
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    align?: 'right' | 'center' | 'left';
    paddingMm?: number;
  } = {}
) {
  const {
    fillColor = COLOR_PALETTE.white,
    strokeColor = COLOR_PALETTE.border,
    textColor = '#000000',
    fontSize = 8.5,
    fontStyle = 'bold',
    align = 'center',
    paddingMm = 1.5,
  } = options;

  if (fillColor) {
    pdf.setFillColor(...hexToRgb(fillColor));
    pdf.rect(x, y, w, h, 'F');
  }

  if (strokeColor) {
    pdf.setDrawColor(...hexToRgb(strokeColor));
    pdf.setLineWidth(0.18);
    pdf.rect(x, y, w, h, 'S');
  }

  safeSetFont(pdf, 'Amiri', fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...hexToRgb(textColor));

  const lines = wrapArabicText(pdf, text, w - (paddingMm * 2));
  const lineHeightMm = (fontSize * 0.3527) * 1.25;
  const totalTextHeight = lines.length * lineHeightMm;
  
  let startY = y + (h - totalTextHeight) / 2 + (fontSize * 0.3527) * 0.85;

  lines.forEach((line) => {
    const rtlText = fixArabicRtl(line);
    let tx = x + w / 2;
    if (align === 'right') {
      tx = x + w - paddingMm;
    } else if (align === 'left') {
      tx = x + paddingMm;
    }
    pdf.text(rtlText, tx, startY, { align });
    startY += lineHeightMm;
  });
}

// Memory font cache so font fetch occurs only once per session
let cachedRegularFontBase64: string | null = null;
let cachedBoldFontBase64: string | null = null;
let cachedLogoDataUrl: string | null = null;

function isValidFont(base64Str: string): boolean {
  if (!base64Str || base64Str.length < 1000) return false;
  try {
    const rawBinary = typeof window !== 'undefined' ? atob(base64Str) : Buffer.from(base64Str, 'base64').toString('binary');
    const bytes = new Uint8Array(rawBinary.length);
    for (let i = 0; i < rawBinary.length; i++) {
      bytes[i] = rawBinary.charCodeAt(i);
    }

    if (bytes.length < 12) return false;

    const sfntVersion = ((bytes[0] << 24) >>> 0) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);

    if (magic === 'wOF2' || magic === 'wOFF') {
      return true;
    }

    const isValidSfnt = sfntVersion === 0x00010000 || sfntVersion === 0x4f54544f || magic === 'true';
    if (!isValidSfnt) return false;

    const numTables = (bytes[4] << 8) | bytes[5];
    return numTables > 0 && numTables <= 200;
  } catch {
    return false;
  }
}

async function fetchArrayBufferAsBase64(url: string): Promise<string> {
  const isFont = url.toLowerCase().endsWith('.ttf');

  let base64Result = '';
  if (typeof window === 'undefined' && url.startsWith('/')) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        if (buffer.length > 100) {
          base64Result = buffer.toString('base64');
        }
      }
    } catch {
      // Fallback to fetch
    }
  }

  if (!base64Result) {
    const targetUrl = typeof window !== 'undefined' && url.startsWith('/')
      ? `${window.location.origin}${url}`
      : url;
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching ${url}`);
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length > 0) {
      let headerStr = '';
      for (let i = 0; i < Math.min(20, bytes.length); i++) {
        headerStr += String.fromCharCode(bytes[i]);
      }
      if (headerStr.includes('<!DOCTYPE') || headerStr.includes('<html') || headerStr.includes('Not Found')) {
        throw new Error(`Invalid non-binary response when fetching ${url}`);
      }
    }

    if (typeof window !== 'undefined') {
      // Browser environment: Use FileReader for base64 conversion
      base64Result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('FileReader base64 conversion failed'));
        reader.readAsDataURL(new Blob([buffer]));
      });
    } else {
      // Node environment: Use Buffer
      base64Result = Buffer.from(buffer).toString('base64');
    }
  }

  if (base64Result && isFont) {
    if (!isValidFont(base64Result)) {
      throw new Error(`Font structural validation failed for ${url}`);
    }
  }

  if (base64Result) {
    return base64Result;
  }

  throw new Error(`Failed to fetch and validate resource at ${url}`);
}

/**
 * Draws the vector header, outer borders, official watermark & footers on a PDF page.
 */
function drawPageDecorations(
  pdf: jsPDF,
  office: OfficeSettings,
  stageIdx: number,
  totalStages: number,
  logoDataUrl?: string | null,
  isPaid?: boolean
) {
  // 1. Dual Vector Border Frame
  // Outer Emerald Line
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.6);
  pdf.rect(10, 10, 190, 277, 'S');

  // Inner Accent Line
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.border));
  pdf.setLineWidth(0.2);
  pdf.rect(11.5, 11.5, 187, 274, 'S');

  // Official Watermark for free-tier/unpaid users
  if (!isPaid) {
    try {
      pdf.saveGraphicsState();
      pdf.setTextColor(215, 215, 215);
      pdf.setFontSize(24);
      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.text(fixArabicRtl('نسخة مجانية — منصة مواريث الرقمية (mawarith.dz)'), 105, 150, {
        align: 'center',
        angle: 35,
      });
      pdf.restoreGraphicsState();
    } catch {
      pdf.setTextColor(220, 220, 220);
      pdf.setFontSize(18);
      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.text(fixArabicRtl('نسخة مجانية — غير مخصصة للاعتماد الرسمي'), 105, 150, { align: 'center' });
    }
  }

  // 2. Official Logo
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', 15, 12, 20, 20);
    } catch (e) {
      console.warn('Could not embed logo image in vector PDF header:', e);
    }
  }

  // 3. Official Court/Notary Header (Right-Aligned)
  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
  pdf.text(fixArabicRtl('الجمهورية الجزائرية الديمقراطية الشعبية'), 190, 17, { align: 'right' });

  pdf.setFontSize(10.5);
  pdf.text(fixArabicRtl('وزارة العدل'), 190, 22, { align: 'right' });

  pdf.setFontSize(11.5);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.text(fixArabicRtl(`${office.officialDesignationAr} - ${office.notaryNameAr}`), 190, 27, { align: 'right' });

  safeSetFont(pdf, 'Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.mutedText));
  pdf.text(fixArabicRtl(`${office.addressAr} - ${office.titleAr}`), 190, 32, { align: 'right' });

  // Horizontal Separator Rule
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.5);
  pdf.line(15, 35, 195, 35);

  // 4. Page Footer Bar
  const footerY = 274;
  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.white));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.3);
  pdf.rect(15, footerY, 180, 10, 'FD');

  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...hexToRgb('#000000'));
  
  const footerLine1 = `العنوان: ${office.addressAr} | هاتف: ${office.phone} | صادر عبر منصة مواريث الرقمية (mawarith.dz)`;
  const footerLine2 = `الأستاذ الموثق ${office.notaryNameAr} | صفحة ${stageIdx + 1} من ${totalStages}`;
  
  pdf.text(fixArabicRtl(footerLine1), 105, footerY + 4, { align: 'center' });
  pdf.text(fixArabicRtl(footerLine2), 105, footerY + 8, { align: 'center' });
}

/**
 * Render a single stage result onto the vector PDF document.
 */
function renderStageVectorPDF(
  pdf: jsPDF,
  stageResult: StageResult,
  stageIdx: number,
  totalStages: number,
  params: {
    estate: number;
    debts: number;
    funeralCosts: number;
    bequest: number;
    deceasedGender: 'male' | 'female' | null;
  },
  officeSettings?: OfficeSettings,
  logoDataUrl?: string | null,
  docRefNumber?: string,
  qrDataUrl?: string | null,
  isPaid?: boolean
) {
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const { estate: globalEstate, debts: globalDebts, funeralCosts: globalFuneralCosts, bequest: globalBequest, deceasedGender } = params;
  const isPureMode = globalEstate === 0;

  // Add new page if not the very first page
  if (stageIdx > 0) {
    pdf.addPage();
  }

  // Draw decorations (borders, headers, logo, footers, watermark)
  drawPageDecorations(pdf, office, stageIdx, totalStages, logoDataUrl, isPaid);

  let currentY = 38;

  // 1. Title Banner
  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.greenLight));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, currentY, 180, 15, 2, 2, 'FD');

  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));

  if (stageIdx === 0) {
    pdf.text(fixArabicRtl('وثيقة تصفية وتقسيم التركة الشرعية'), 105, currentY + 6.5, { align: 'center' });
    safeSetFont(pdf, 'Amiri', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.mutedText));
    pdf.text(fixArabicRtl('مستخرج من المنظومة التوثيقية الرقمية - وفق أحكام قانون الأسرة الجزائري (الأمر 84-11)'), 105, currentY + 11.5, { align: 'center' });
  } else {
    pdf.text(fixArabicRtl(`المناسخة رقم ${stageIdx}: تصفية حصة الوارث المتوفى`), 105, currentY + 6.5, { align: 'center' });
    safeSetFont(pdf, 'Amiri', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.mutedText));
    const deceasedName = stageResult.stage.deceasedName || `الوارث الفرعي رقم ${stageIdx}`;
    pdf.text(fixArabicRtl(`توزيع نصيب المتوفى: ${deceasedName} إلى ورثته الخصوصيين`), 105, currentY + 11.5, { align: 'center' });
  }

  currentY += 18;

  if (stageResult.hasUnverifiedOverride) {
    pdf.setFillColor(...hexToRgb(COLOR_PALETTE.amberLight || '#FEF3C7'));
    pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.amber || '#D97706'));
    pdf.setLineWidth(0.4);
    pdf.roundedRect(15, currentY, 180, 10, 1.5, 1.5, 'FD');

    safeSetFont(pdf, 'Amiri', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.amber || '#D97706'));
    pdf.text(fixArabicRtl('تنبيه هام: تم تجاوز استبعاد الميراث في هذه المرحلة يدوياً (تجاوز غير معتمد فقهياً/قانونياً)'), 192, currentY + 4, { align: 'right' });
    
    safeSetFont(pdf, 'Amiri', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...hexToRgb('#78350F'));
    pdf.text(fixArabicRtl('الحسابات الصادرة تحت هذا التجاوز تعتبر غير صالحة للاستخدام الرسمي أو التوثيقي.'), 192, currentY + 8, { align: 'right' });

    currentY += 12;
  }

  // 2. Legal Disclaimer Box OR Official Notary Banner (Stage 0 Page 1)
  if (stageIdx === 0) {
    if (office.isOfficialMode || office.showDisclaimer === false) {
      // Professional office header; this is formatting only, not an official attestation.
      pdf.setFillColor(...hexToRgb(COLOR_PALETTE.greenLight));
      pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.amber));
      pdf.setLineWidth(0.4);
      pdf.roundedRect(15, currentY, 180, 20, 2, 2, 'FD');

      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
      pdf.text(fixArabicRtl('تقرير مهني للمراجعة — بيانات المكتب كما أدخلها المستخدم'), 192, currentY + 5, { align: 'right' });

      safeSetFont(pdf, 'Amiri', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...hexToRgb('#1E293B'));
      pdf.text(fixArabicRtl(`مرجع التقرير: ${docRefNumber}`), 192, currentY + 10, { align: 'right' });
      pdf.text(fixArabicRtl(`بيانات الموثق/المكتب: ${office.notaryNameAr} — ${office.titleAr}`), 192, currentY + 14, { align: 'right' });
      pdf.setFontSize(7);
      pdf.setTextColor(...hexToRgb('#7F1D1D'));
      pdf.text(fixArabicRtl('لا يشكل هذا التقرير محرراً رسمياً ولا يثبت اعتماد الموثق أو صحة الوقائع.'), 192, currentY + 18, { align: 'right' });

      if (qrDataUrl) {
        try {
          pdf.addImage(qrDataUrl, 'PNG', 18, currentY + 2, 12, 12);
        } catch {
          // ignore qr draw errors
        }
      }

      currentY += 23;
    } else {
      // Standard Legal Disclaimer Box
      pdf.setFillColor(...hexToRgb(COLOR_PALETTE.redLight));
      pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.red));
      pdf.setLineWidth(0.3);
      pdf.roundedRect(15, currentY, 180, 16, 2, 2, 'FD');

      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...hexToRgb(COLOR_PALETTE.red));
      pdf.text(fixArabicRtl(EXPORT_OFFICE_INFO.disclaimerTitleAr), 192, currentY + 4.5, { align: 'right' });

      safeSetFont(pdf, 'Amiri', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...hexToRgb('#7F1D1D'));
      const discLines = wrapArabicText(pdf, EXPORT_OFFICE_INFO.disclaimerTextAr, 174);
      let dY = currentY + 8.5;
      discLines.forEach((l) => {
        pdf.text(fixArabicRtl(l), 192, dY, { align: 'right' });
        dY += 3.5;
      });

      currentY += 19;
    }
  }

  // 3. Deceased Name Banner
  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.slateLight));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, currentY, 180, 8, 1.5, 1.5, 'FD');

  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
  const dPronoun = deceasedPronoun(deceasedGender);
  const dName = stageResult.stage.deceasedName?.trim() || dPronoun;

  if (stageIdx === 0) {
    pdf.text(fixArabicRtl(`مسألة تركة ${dPronoun}: ${dName}`), 105, currentY + 5.5, { align: 'center' });
  } else {
    pdf.text(fixArabicRtl(`تصفية تركة الوارث الفرعي المتوفى: ${dName}`), 105, currentY + 5.5, { align: 'center' });
  }

  currentY += 11;

  // 4. Pre-liquidation Estate Summary Table (Stage 0)
  if (stageIdx === 0) {
    if (isPureMode) {
      pdf.setFillColor(...hexToRgb(COLOR_PALETTE.white));
      pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
      pdf.setLineWidth(0.2);
      pdf.rect(15, currentY, 180, 7, 'FD');

      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
      pdf.text(
        fixArabicRtl('نمط التصفية النظرية (النسب والمقادير): تم تفعيل الميزان الشرعي الفرضي لتحديد الورثة ونسب السهام الشرعية.'),
        192,
        currentY + 4.8,
        { align: 'right' }
      );
      currentY += 10;
    } else {
      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
      pdf.text(fixArabicRtl('أولاً: ملخص التركة والاستقطاعات والديون الشرعية (قبل القسمة)'), 195, currentY + 4, { align: 'right' });
      currentY += 6;

      const sumCols = [36, 36, 36, 36, 36];
      const sumX = [15, 51, 87, 123, 159];
      const sumHeaders = ['صافي التركة الموزعة', 'الوصايا الشرعية', 'تكاليف تجهيز الجنازة', 'الديون والتبعات الوفائية', 'التركة الإجمالية'];
      const sumVals = [
        formatCurrency(stageResult.netEstate ?? 0),
        formatCurrency(globalBequest),
        formatCurrency(globalFuneralCosts),
        formatCurrency(globalDebts),
        formatCurrency(globalEstate),
      ];

      for (let c = 0; c < 5; c++) {
        drawVectorCell(pdf, sumHeaders[c], sumX[c], currentY, sumCols[c], 6.5, {
          fillColor: COLOR_PALETTE.green,
          textColor: COLOR_PALETTE.white,
          fontSize: 8,
          fontStyle: 'bold',
        });
        drawVectorCell(pdf, sumVals[c], sumX[c], currentY + 6.5, sumCols[c], 6.5, {
          fillColor: COLOR_PALETTE.white,
          textColor: '#000000',
          fontSize: 8.5,
          fontStyle: 'bold',
        });
      }

      currentY += 16;
    }
  }

  // 5. Distribution Heading
  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
  if (stageIdx === 0) {
    pdf.text(fixArabicRtl('ثانياً: جدول توزيع السهام والحصص على الورثة المستحقين فريضة'), 195, currentY + 4, { align: 'right' });
  } else {
    pdf.text(fixArabicRtl('توزيع السهام والحصص الشرعية لهذه المناسخة'), 195, currentY + 4, { align: 'right' });
  }
  currentY += 6;

  // 6. Correction Base Box
  const firstValidForBase = stageResult.results.find(
    (r) => !r.isBlocked && r.heirId !== 'mandatory_bequest' && r.heirId !== 'voluntary_bequest'
  );
  const stageProblemBase = firstValidForBase?.problemBase ?? null;

  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.slateLight));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.2);
  pdf.rect(15, currentY, 180, 7, 'FD');

  safeSetFont(pdf, 'Amiri', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
  pdf.text(fixArabicRtl(`أصل المسألة التصحيحي الشرعي: ${stageProblemBase ?? '-'}`), 192, currentY + 4.8, { align: 'right' });

  if (stageIdx > 0 && !isPureMode) {
    pdf.text(fixArabicRtl(`حصة التصفية للمناسخة: ${formatCurrency(stageResult.netEstate)}`), 18, currentY + 4.8, { align: 'left' });
  }

  currentY += 9;

  // 7. Awl / Radd Notice Banner
  const calcType = stageResult.results[0]?.calculationType;
  if (calcType && calcType !== 'normal') {
    const alertText = calcType === 'awl'
      ? '● عول (المادة 166): تم تطبيق ضوابط العول ونقل السهام الشرعية لتوزيع النقص بالعدل.'
      : '● رد (المادة 167): تم تطبيق رد الفائض بالكامل على ذوي الفروض الشرعية غير الزوجين.';

    pdf.setFillColor(...hexToRgb(calcType === 'awl' ? COLOR_PALETTE.awlBg : COLOR_PALETTE.raddBg));
    pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.border));
    pdf.setLineWidth(0.2);
    pdf.rect(15, currentY, 180, 6.5, 'FD');

    safeSetFont(pdf, 'Amiri', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb('#000000'));
    pdf.text(fixArabicRtl(alertText), 192, currentY + 4.5, { align: 'right' });

    currentY += 8.5;
  }

  // 8. Main Distribution Vector Table (Enterprise 7-Column Layout)
  // Columns (Total width: 180mm from X=15 to X=195)
  // Col 0: Legal Art (20mm)
  // Col 1: Amount DZD (32mm)
  // Col 2: Percentage (18mm)
  // Col 3: Shares (16mm)
  // Col 4: Share Fraction (20mm)
  // Col 5: Reason/Role (44mm)
  // Col 6: Name (30mm)
  const colW = [20, 32, 18, 16, 20, 44, 30];
  const colX = [15, 35, 67, 85, 101, 121, 165];

  const tableHeaders = [
    EXPORT_TABLE_COLUMNS[6].label, // السند القانوني
    EXPORT_TABLE_COLUMNS[5].label, // المبلغ المستحق (دج)
    EXPORT_TABLE_COLUMNS[4].label, // النسبة (%)
    EXPORT_TABLE_COLUMNS[3].label, // السهام
    EXPORT_TABLE_COLUMNS[2].label, // النصيب الشرعي
    EXPORT_TABLE_COLUMNS[1].label, // صفة الإرث والسبب
    EXPORT_TABLE_COLUMNS[0].label, // الوارث
  ];

  const headerH = 7.5;

  const renderTableHeader = () => {
    for (let c = 0; c < 7; c++) {
      drawVectorCell(pdf, tableHeaders[c], colX[c], currentY, colW[c], headerH, {
        fillColor: COLOR_PALETTE.green,
        textColor: COLOR_PALETTE.white,
        fontSize: 8.5,
        fontStyle: 'bold',
      });
    }
    currentY += headerH;
  };

  renderTableHeader();

  const getDynamicRowH = (rowData: string[]) => {
    let maxLines = 1;
    for (let c = 0; c < 7; c++) {
      safeSetFont(pdf, 'Amiri', 'bold');
      pdf.setFontSize(8);
      const lines = wrapArabicText(pdf, rowData[c], colW[c] - 3);
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    }
    return Math.max(7, (maxLines * 3.5) + 3);
  };

  const checkOverflowAndNewPage = (neededH: number) => {
    if (currentY + neededH > 262) {
      pdf.addPage();
      drawPageDecorations(pdf, office, stageIdx, totalStages, logoDataUrl, isPaid);
      currentY = 38;
      renderTableHeader();
    }
  };

  const results = stageResult.results;
  const stage = stageResult.stage;
  const bequests = results.filter((r) => !r.isBlocked && (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest'));
  const inheritors = results.filter((r) => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');

  // Render Bequests rows
  bequests.forEach((b) => {
    const typeLabel = b.heirId === 'mandatory_bequest' ? 'تنزيل (وصية واجبة)' : 'وصية اختيارية';
    const bPct = b.shareFraction.valueOf() * 100;
    const bPctStr = bPct > 0 ? (bPct % 1 === 0 ? `${bPct}%` : `${bPct.toFixed(2)}%`) : '0%';
    const amtStr = isPureMode ? '-' : formatCurrency(b.amount);
    const artText = b.article ? `م ${b.article}` : 'م 169';

    const rowData = [artText, amtStr, bPctStr, '-', b.share, typeLabel, b.nameAr];
    const dynamicH = getDynamicRowH(rowData);
    checkOverflowAndNewPage(dynamicH);

    for (let c = 0; c < 7; c++) {
      drawVectorCell(pdf, rowData[c], colX[c], currentY, colW[c], dynamicH, {
        fillColor: COLOR_PALETTE.bequestRow,
        textColor: '#000000',
        fontSize: 8,
        fontStyle: 'bold',
        align: c === 5 || c === 6 ? 'right' : 'center',
      });
    }
    currentY += dynamicH;
  });

  // Render Inheritor rows
  let rowIndex = 0;
  inheritors.forEach((r) => {
    const presence = stage.heirPresence?.[r.heirId];
    const customNames = presence?.customNames;

    for (let i = 0; i < r.count; i++) {
      const indResult = r.individuals?.[i];
      const isBlocked = indResult ? indResult.isBlocked : r.isBlocked;
      if (isBlocked) continue;

      const customName = customNames?.[i];
      const isolatedCustom = customName && !/[\u0600-\u06FF]/.test(customName) ? `\u2066${customName}\u2069` : customName;
      const baseName = r.count > 1 ? `${r.nameAr} (${i + 1})` : r.nameAr;
      const displayName = isolatedCustom ? `${isolatedCustom} (${r.nameAr})` : baseName;

      const individualAmt = indResult ? indResult.amount : r.amount / r.count;
      const indShare = indResult ? indResult.share : r.share;
      const indSharesVal = indResult ? indResult.shares : (r.shares > 0 ? Math.round(r.shares / r.count) : 0);
      const indSharesText = String(indSharesVal);

      const indShareFrac = indResult && indResult.shareFraction ? indResult.shareFraction : r.shareFraction.compare(0) === 0 ? new Fraction(0) : r.shareFraction.div(r.count);
      const indPct = indShareFrac.valueOf() * 100;
      const indPctStr = indPct > 0 ? (indPct % 1 === 0 ? `${indPct}%` : `${indPct.toFixed(2)}%`) : '0%';
      const amtStr = isPureMode ? '-' : formatCurrency(individualAmt);
      const reason = indResult ? indResult.reason : r.reason;
      const artText = r.article ? `م ${r.article}` : '-';

      const rowBg = rowIndex % 2 === 0 ? COLOR_PALETTE.white : COLOR_PALETTE.mint;

      const rowData = [artText, amtStr, indPctStr, indSharesText, indShare, reason, displayName];
      const dynamicH = getDynamicRowH(rowData);
      checkOverflowAndNewPage(dynamicH);

      for (let c = 0; c < 7; c++) {
        drawVectorCell(pdf, rowData[c], colX[c], currentY, colW[c], dynamicH, {
          fillColor: rowBg,
          textColor: '#000000',
          fontSize: 8,
          fontStyle: 'bold',
          align: c === 5 || c === 6 ? 'right' : 'center',
        });
      }
      currentY += dynamicH;
      rowIndex++;
    }
  });

  // Totals Row
  checkOverflowAndNewPage(headerH);
  drawVectorCell(pdf, '-', colX[0], currentY, colW[0], headerH, { fillColor: COLOR_PALETTE.green, textColor: COLOR_PALETTE.white });
  drawVectorCell(pdf, isPureMode ? '-' : formatCurrency(stageResult.netEstate), colX[1], currentY, colW[1], headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8,
    fontStyle: 'bold',
  });
  drawVectorCell(pdf, '100%', colX[2], currentY, colW[2], headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8,
    fontStyle: 'bold',
  });
  drawVectorCell(pdf, String(stageProblemBase ?? '-'), colX[3], currentY, colW[3], headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8.5,
    fontStyle: 'bold',
  });
  drawVectorCell(pdf, '-', colX[4], currentY, colW[4], headerH, { fillColor: COLOR_PALETTE.green, textColor: COLOR_PALETTE.white });

  const mergedW = colW[5] + colW[6];
  drawVectorCell(pdf, 'المجموع الكلي للحصص والسهام المصححة للمسألة', colX[5], currentY, mergedW, headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8.5,
    fontStyle: 'bold',
    align: 'right',
  });

  currentY += headerH + 6;

  // 9. Treasury Section (if applicable)
  if (stageResult.noHeirsRedistribution && stageResult.noHeirsRedistribution.policy === 'treasury') {
    safeSetFont(pdf, 'Amiri', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
    pdf.text(fixArabicRtl('مستحقين الخزينة العمومية للدولة (المادة 180):'), 195, currentY + 3.5, { align: 'right' });
    currentY += 5;

    const tCols = [45, 90, 45];
    const tX = [15, 60, 150];
    const tHeaders = ['الحصة وإجمالي الأموال الشاغرة', 'السبب الدستوري والقانوني', 'الجهة المستحقة'];
    const tVals = [formatCurrency(stageResult.noHeirsRedistribution.amount), stageResult.noHeirsRedistribution.messageAr, 'مديرية أملاك الدولة / الخزينة العامة'];

    for (let col = 0; col < 3; col++) {
      drawVectorCell(pdf, tHeaders[col], tX[col], currentY, tCols[col], 6.5, {
        fillColor: COLOR_PALETTE.green,
        textColor: COLOR_PALETTE.white,
        fontSize: 8,
        fontStyle: 'bold',
      });
      drawVectorCell(pdf, tVals[col], tX[col], currentY + 6.5, tCols[col], 6.5, {
        fillColor: COLOR_PALETTE.treasuryBg,
        textColor: '#000000',
        fontSize: 8,
        fontStyle: 'bold',
        align: col === 1 ? 'right' : 'center',
      });
    }
    currentY += 18;
  }

  // 10. Blocked / Excluded Heirs Table
  const blockedRows: { name: string; reason: string; article: string }[] = [];
  const possibleBlocked = results.filter((r) => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');
  possibleBlocked.forEach((bh) => {
    const presence = stage.heirPresence?.[bh.heirId];
    const customNames = presence?.customNames;

    for (let i = 0; i < bh.count; i++) {
      const indResult = bh.individuals?.[i];
      const isBlocked = indResult ? indResult.isBlocked : bh.isBlocked;
      if (!isBlocked) continue;

      const customName = customNames?.[i];
      const isolatedCustom = customName && !/[\u0600-\u06FF]/.test(customName) ? `\u2066${customName}\u2069` : customName;
      const baseName = bh.count > 1 ? `${bh.nameAr} (${i + 1})` : bh.nameAr;
      const displayName = isolatedCustom ? `${isolatedCustom} (${bh.nameAr})` : baseName;
      const reason = indResult ? indResult.reason : bh.reason || 'محجوب لتواجد وارث أقرب أحق بفرض الحجب';
      const artText = bh.article ? `م ${bh.article}` : '-';

      blockedRows.push({ name: displayName, reason, article: artText });
    }
  });

  if (blockedRows.length > 0) {
    safeSetFont(pdf, 'Amiri', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
    pdf.text(fixArabicRtl('الأقارب والورثة المحجوبون أو المستبعدون بموجب أحكام الميراث:'), 195, currentY + 3.5, { align: 'right' });
    currentY += 5;

    const bCols = [30, 105, 45];
    const bX = [15, 45, 150];
    const bHeaders = ['المستند القانوني', 'سبب ومستند الحجب / الاستبعاد الفرضي من الميراث', 'الاسم والصلة'];

    for (let col = 0; col < 3; col++) {
      drawVectorCell(pdf, bHeaders[col], bX[col], currentY, bCols[col], 6.5, {
        fillColor: COLOR_PALETTE.red,
        textColor: COLOR_PALETTE.white,
        fontSize: 8,
        fontStyle: 'bold',
      });
    }
    currentY += 6.5;

    blockedRows.forEach((row) => {
      const rowVals = [row.article, row.reason, row.name];
      for (let col = 0; col < 3; col++) {
        drawVectorCell(pdf, rowVals[col], bX[col], currentY, bCols[col], 6.5, {
          fillColor: COLOR_PALETTE.blockedRow,
          textColor: '#000000',
          fontSize: 8,
          fontStyle: 'bold',
          align: col === 1 ? 'right' : 'center',
        });
      }
      currentY += 6.5;
    });
  }
}

/**
 * Master PDF Export function creating a high-grade native vector PDF document.
 */
export async function exportToPDF(
  allStagesResults: StageResult[],
  params: {
    estate: number;
    debts: number;
    funeralCosts: number;
    bequest: number;
    deceasedGender: 'male' | 'female' | null;
  },
  officeSettings?: OfficeSettings,
  isPaid?: boolean
): Promise<void> {
  const rootStage = allStagesResults[0];
  const deceasedGender = params.deceasedGender;
  const rootDeceasedName = rootStage?.stage.deceasedName?.trim() || deceasedPronoun(deceasedGender);

  const office = { ...(officeSettings || DEFAULT_OFFICE_SETTINGS) };
  const hasAnyOverride = allStagesResults.some(sr => sr.hasUnverifiedOverride);
  if (hasAnyOverride) {
    office.isOfficialMode = false;
    office.showDisclaimer = true;
  }

  // 1. Prefetch & cache Amiri fonts (Regular and Bold)
  try {
    if (!cachedRegularFontBase64) {
      cachedRegularFontBase64 = await fetchArrayBufferAsBase64('/fonts/amiri-regular.ttf');
    }
    if (!cachedBoldFontBase64) {
      cachedBoldFontBase64 = await fetchArrayBufferAsBase64('/fonts/amiri-bold.ttf');
    }
  } catch (err) {
    console.error('Failed to prefetch Amiri fonts for vector PDF:', err);
    throw new Error('تعذر تحميل خطوط العربية للـ PDF. يرجى إعادة المحاولة.');
  }

  // 2. Prefetch logo image
  try {
    if (!cachedLogoDataUrl) {
      const logoBase64 = await fetchArrayBufferAsBase64('/icons/android-chrome-192x192.png');
      cachedLogoDataUrl = `data:image/png;base64,${logoBase64}`;
    }
  } catch (err) {
    console.warn('Failed to prefetch logo image for vector PDF:', err);
  }

  // 3. Initialize jsPDF document
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // 4. Register fonts in jsPDF with robust error handling
  try {
    if (cachedRegularFontBase64) {
      pdf.addFileToVFS('Amiri-Regular.ttf', cachedRegularFontBase64);
      pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    }
    if (cachedBoldFontBase64) {
      pdf.addFileToVFS('Amiri-Bold.ttf', cachedBoldFontBase64);
      pdf.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');
    }
    safeSetFont(pdf, 'Amiri', 'normal');
  } catch (fontErr) {
    console.warn('Font registration warning:', fontErr);
    pdf.setFont('helvetica', 'normal');
  }

  const docRefNumber = generateDocumentRefNumber();
  const qrDataUrl = await generateQRCodeDataUrl(docRefNumber);

  // 5. Render each stage as a clean vector page
  for (let idx = 0; idx < allStagesResults.length; idx++) {
    const stageResult = allStagesResults[idx];
    renderStageVectorPDF(
      pdf,
      stageResult,
      idx,
      allStagesResults.length,
      params,
      office,
      cachedLogoDataUrl,
      docRefNumber,
      qrDataUrl,
      isPaid
    );
  }

  // Export locally. No server endpoint, entitlement token, or remote file processing.
  const documentFileName = EXPORT_FILENAME(rootDeceasedName, 'pdf', office.notaryNameAr);
  pdf.save(documentFileName);
}
