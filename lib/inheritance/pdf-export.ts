/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf';
import { StageResult } from '@/components/inheritance/ResultsTable';
import Fraction from 'fraction.js';
import { ArabicShaper } from 'arabic-persian-reshaper';
import {
  COLOR_PALETTE,
  EXPORT_OFFICE_INFO,
  formatDocumentCurrency,
  EXPORT_TABLE_COLUMNS,
  EXPORT_FILENAME,
  OfficeSettings,
  DEFAULT_OFFICE_SETTINGS
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

/**
 * Prepares Arabic text for native jsPDF vector rendering:
 * Reshapes characters using ArabicShaper to connect letters correctly in logical order.
 */
export function fixArabicRtl(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!str.trim()) return '';

  return ArabicShaper.convertArabic(str);
}

/**
 * Wraps text into multiple lines given a maximum width in millimeters for jsPDF.
 */
function wrapArabicText(pdf: any, text: string, maxWidthMm: number): string[] {
  if (!text) return [''];
  const words = String(text).split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    const testLineRtl = fixArabicRtl(testLine);
    const width = pdf.getTextWidth(testLineRtl);
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
  pdf: any,
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

  pdf.setFont('Amiri', fontStyle);
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
    const tempPdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });
    tempPdf.addFileToVFS('temp-test.ttf', base64Str);
    tempPdf.addFont('temp-test.ttf', 'TempTest', 'normal');
    tempPdf.setFont('TempTest', 'normal');
    const width = tempPdf.getTextWidth('اختبار');
    return typeof width === 'number' && width > 0;
  } catch (err) {
    console.warn('Font validation check failed:', err);
    return false;
  }
}

async function fetchArrayBufferAsBase64(url: string): Promise<string> {
  const candidates: string[] = [url];
  const isFont = url.toLowerCase().endsWith('.ttf');

  if (url.includes('amiri-regular.ttf')) {
    candidates.push('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf');
    candidates.push('https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf');
  } else if (url.includes('amiri-bold.ttf')) {
    candidates.push('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf');
    candidates.push('https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf');
  }

  let lastError: any = null;
  for (const candidate of candidates) {
    try {
      let base64Result = '';
      if (typeof window === 'undefined' && candidate.startsWith('/')) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const localPath = path.join(process.cwd(), 'public', candidate);
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
        const targetUrl = typeof window !== 'undefined' && candidate.startsWith('/')
          ? `${window.location.origin}${candidate}`
          : candidate;
        const response = await fetch(targetUrl);
        if (!response.ok) {
          continue;
        }
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.length > 0) {
          let headerStr = '';
          for (let i = 0; i < Math.min(20, bytes.length); i++) {
            headerStr += String.fromCharCode(bytes[i]);
          }
          if (headerStr.includes('<!DOCTYPE') || headerStr.includes('<html') || headerStr.includes('Not Found')) {
            continue;
          }
        }
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Result = btoa(binary);
      }

      if (base64Result) {
        if (isFont) {
          if (!isValidFont(base64Result)) {
            console.warn(`Font candidate validation failed for ${candidate}, trying next candidate...`);
            continue;
          }
        }
        return base64Result;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed to fetch and validate resource at ${url}`);
}

/**
 * Draws the vector header, outer borders, official watermark & footers on a PDF page.
 */
function drawPageDecorations(
  pdf: any,
  office: OfficeSettings,
  stageIdx: number,
  totalStages: number,
  logoDataUrl?: string | null
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

  // 2. Official Logo
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', 15, 12, 20, 20);
    } catch (e) {
      console.warn('Could not embed logo image in vector PDF header:', e);
    }
  }

  // 3. Official Court/Notary Header (Right-Aligned)
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));
  pdf.text(fixArabicRtl('الجمهورية الجزائرية الديمقراطية الشعبية'), 190, 17, { align: 'right' });

  pdf.setFontSize(10.5);
  pdf.text(fixArabicRtl('وزارة العدل'), 190, 22, { align: 'right' });

  pdf.setFontSize(11.5);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.text(fixArabicRtl(`${office.officialDesignationAr} - ${office.notaryNameAr}`), 190, 27, { align: 'right' });

  pdf.setFont('Amiri', 'normal');
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

  pdf.setFont('Amiri', 'bold');
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
  pdf: any,
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
  logoDataUrl?: string | null
) {
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const { estate: globalEstate, debts: globalDebts, funeralCosts: globalFuneralCosts, bequest: globalBequest, deceasedGender } = params;
  const isPureMode = globalEstate === 0;

  // Add new page if not the very first page
  if (stageIdx > 0) {
    pdf.addPage();
  }

  // Draw decorations (borders, headers, logo, footers)
  drawPageDecorations(pdf, office, stageIdx, totalStages, logoDataUrl);

  let currentY = 38;

  // 1. Title Banner
  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.greenLight));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, currentY, 180, 15, 2, 2, 'FD');

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(...hexToRgb(COLOR_PALETTE.greenDark));

  if (stageIdx === 0) {
    pdf.text(fixArabicRtl('وثيقة تصفية وتقسيم التركة الشرعية'), 105, currentY + 6.5, { align: 'center' });
    pdf.setFont('Amiri', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.mutedText));
    pdf.text(fixArabicRtl('مستخرج من المنظومة التوثيقية الرقمية - وفق أحكام قانون الأسرة الجزائري (الأمر 84-11)'), 105, currentY + 11.5, { align: 'center' });
  } else {
    pdf.text(fixArabicRtl(`المناسخة رقم ${stageIdx}: تصفية حصة الوارث المتوفى`), 105, currentY + 6.5, { align: 'center' });
    pdf.setFont('Amiri', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.mutedText));
    const deceasedName = stageResult.stage.deceasedName || `الوارث الفرعي رقم ${stageIdx}`;
    pdf.text(fixArabicRtl(`توزيع نصيب المتوفى: ${deceasedName} إلى ورثته الخصوصيين`), 105, currentY + 11.5, { align: 'center' });
  }

  currentY += 18;

  // 2. Legal Disclaimer Box (Stage 0 Page 1)
  if (stageIdx === 0) {
    pdf.setFillColor(...hexToRgb(COLOR_PALETTE.redLight));
    pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.red));
    pdf.setLineWidth(0.3);
    pdf.roundedRect(15, currentY, 180, 16, 2, 2, 'FD');

    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...hexToRgb(COLOR_PALETTE.red));
    pdf.text(fixArabicRtl(EXPORT_OFFICE_INFO.disclaimerTitleAr), 192, currentY + 4.5, { align: 'right' });

    pdf.setFont('Amiri', 'normal');
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

  // 3. Deceased Name Banner
  pdf.setFillColor(...hexToRgb(COLOR_PALETTE.slateLight));
  pdf.setDrawColor(...hexToRgb(COLOR_PALETTE.green));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, currentY, 180, 8, 1.5, 1.5, 'FD');

  pdf.setFont('Amiri', 'bold');
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

      pdf.setFont('Amiri', 'bold');
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
      pdf.setFont('Amiri', 'bold');
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
  pdf.setFont('Amiri', 'bold');
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

  pdf.setFont('Amiri', 'bold');
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

    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...hexToRgb('#000000'));
    pdf.text(fixArabicRtl(alertText), 192, currentY + 4.5, { align: 'right' });

    currentY += 8.5;
  }

  // 8. Main Distribution Vector Table
  // Columns (Total width: 180mm from X=15 to X=195)
  // Col 0: Legal Art (20mm)
  // Col 1: Amount/Pct (45mm)
  // Col 2: Shares (20mm)
  // Col 3: Share Fraction (20mm)
  // Col 4: Reason (45mm)
  // Col 5: Name (30mm)
  const colW = [20, 45, 20, 20, 45, 30];
  const colX = [15, 35, 80, 100, 120, 165];

  const tableHeaders = [
    EXPORT_TABLE_COLUMNS[5].label,
    isPureMode ? EXPORT_TABLE_COLUMNS[4].labelPure : EXPORT_TABLE_COLUMNS[4].label,
    EXPORT_TABLE_COLUMNS[3].label,
    EXPORT_TABLE_COLUMNS[2].label,
    EXPORT_TABLE_COLUMNS[1].label,
    EXPORT_TABLE_COLUMNS[0].label,
  ];

  const headerH = 7.5;
  for (let c = 0; c < 6; c++) {
    drawVectorCell(pdf, tableHeaders[c], colX[c], currentY, colW[c], headerH, {
      fillColor: COLOR_PALETTE.green,
      textColor: COLOR_PALETTE.white,
      fontSize: 8.5,
      fontStyle: 'bold',
    });
  }
  currentY += headerH;

  const results = stageResult.results;
  const stage = stageResult.stage;
  const bequests = results.filter((r) => !r.isBlocked && (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest'));
  const inheritors = results.filter((r) => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');

  const rowH = 7;

  // Render Bequests rows
  bequests.forEach((b) => {
    const typeLabel = b.heirId === 'mandatory_bequest' ? 'تنزيل (وصية واجبة)' : 'وصية اختيارية';
    const bPct = b.shareFraction.valueOf() * 100;
    const bPctStr = bPct > 0 ? (bPct % 1 === 0 ? `${bPct}%` : `${bPct.toFixed(2)}%`) : '0%';
    const valStr = isPureMode ? bPctStr : `${formatCurrency(b.amount)} (${bPctStr})`;
    const artText = b.article ? `م ${b.article}` : 'م 169';

    const rowData = [artText, valStr, '-', b.share, typeLabel, b.nameAr];
    for (let c = 0; c < 6; c++) {
      drawVectorCell(pdf, rowData[c], colX[c], currentY, colW[c], rowH, {
        fillColor: COLOR_PALETTE.bequestRow,
        textColor: '#000000',
        fontSize: 8,
        fontStyle: 'bold',
        align: c === 4 || c === 5 ? 'right' : 'center',
      });
    }
    currentY += rowH;
  });

  // Render Inheritor rows
  let rowIndex = 0;
  inheritors.forEach((r) => {
    const presence = stage.heirPresence[r.heirId];
    const customNames = presence?.customNames;

    for (let i = 0; i < r.count; i++) {
      const indResult = r.individuals?.[i];
      const isBlocked = indResult ? indResult.isBlocked : r.isBlocked;
      if (isBlocked) continue;

      const customName = customNames?.[i];
      const baseName = r.count > 1 ? `${r.nameAr} (${i + 1})` : r.nameAr;
      const displayName = customName ? `${customName} (${r.nameAr})` : baseName;

      const individualAmt = indResult ? indResult.amount : r.amount / r.count;
      const indShare = indResult ? indResult.share : r.share;
      const indSharesText = indResult ? String(indResult.shares) : String(r.shares > 0 ? r.shares / r.count : 0);

      const indShareFrac = indResult && indResult.shareFraction ? indResult.shareFraction : r.shareFraction.compare(0) === 0 ? new Fraction(0) : r.shareFraction.div(r.count);
      const indPct = indShareFrac.valueOf() * 100;
      const indPctStr = indPct > 0 ? (indPct % 1 === 0 ? `${indPct}%` : `${indPct.toFixed(2)}%`) : '0%';
      const valStr = isPureMode ? indPctStr : `${formatCurrency(individualAmt)} (${indPctStr})`;
      const reason = indResult ? indResult.reason : r.reason;
      const artText = r.article ? `م ${r.article}` : '-';

      const rowBg = rowIndex % 2 === 0 ? COLOR_PALETTE.white : COLOR_PALETTE.mint;

      const rowData = [artText, valStr, indSharesText, indShare, reason, displayName];
      for (let c = 0; c < 6; c++) {
        drawVectorCell(pdf, rowData[c], colX[c], currentY, colW[c], rowH, {
          fillColor: rowBg,
          textColor: '#000000',
          fontSize: 8,
          fontStyle: 'bold',
          align: c === 4 || c === 5 ? 'right' : 'center',
        });
      }
      currentY += rowH;
      rowIndex++;
    }
  });

  // Totals Row
  drawVectorCell(pdf, '-', colX[0], currentY, colW[0], headerH, { fillColor: COLOR_PALETTE.green, textColor: COLOR_PALETTE.white });
  drawVectorCell(pdf, isPureMode ? '100%' : `${formatCurrency(stageResult.netEstate)} (100%)`, colX[1], currentY, colW[1], headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8.5,
    fontStyle: 'bold',
  });
  drawVectorCell(pdf, String(stageProblemBase ?? '-'), colX[2], currentY, colW[2], headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8.5,
    fontStyle: 'bold',
  });
  drawVectorCell(pdf, '-', colX[3], currentY, colW[3], headerH, { fillColor: COLOR_PALETTE.green, textColor: COLOR_PALETTE.white });

  const mergedW = colW[4] + colW[5];
  drawVectorCell(pdf, 'المجموع الكلي للحصص والسهام المصححة للمسألة', colX[4], currentY, mergedW, headerH, {
    fillColor: COLOR_PALETTE.green,
    textColor: COLOR_PALETTE.white,
    fontSize: 8.5,
    fontStyle: 'bold',
    align: 'right',
  });

  currentY += headerH + 6;

  // 9. Treasury Section (if applicable)
  if (stageResult.noHeirsRedistribution && stageResult.noHeirsRedistribution.policy === 'treasury') {
    pdf.setFont('Amiri', 'bold');
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
    const presence = stage.heirPresence[bh.heirId];
    const customNames = presence?.customNames;

    for (let i = 0; i < bh.count; i++) {
      const indResult = bh.individuals?.[i];
      const isBlocked = indResult ? indResult.isBlocked : bh.isBlocked;
      if (!isBlocked) continue;

      const customName = customNames?.[i];
      const baseName = bh.count > 1 ? `${bh.nameAr} (${i + 1})` : bh.nameAr;
      const displayName = customName ? `${customName} (${bh.nameAr})` : baseName;
      const reason = indResult ? indResult.reason : bh.reason || 'محجوب لتواجد وارث أقرب أحق بفرض الحجب';
      const artText = bh.article ? `م ${bh.article}` : '-';

      blockedRows.push({ name: displayName, reason, article: artText });
    }
  });

  if (blockedRows.length > 0) {
    pdf.setFont('Amiri', 'bold');
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
  officeSettings?: OfficeSettings
): Promise<void> {
  const rootStage = allStagesResults[0];
  const deceasedGender = params.deceasedGender;
  const rootDeceasedName = rootStage?.stage.deceasedName?.trim() || deceasedPronoun(deceasedGender);

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
    pdf.setFont('Amiri', 'normal');
  } catch (fontErr) {
    console.warn('Font registration warning:', fontErr);
    pdf.setFont('helvetica', 'normal');
  }

  // 5. Render each stage as a clean vector page
  for (let idx = 0; idx < allStagesResults.length; idx++) {
    const stageResult = allStagesResults[idx];
    renderStageVectorPDF(pdf, stageResult, idx, allStagesResults.length, params, officeSettings, cachedLogoDataUrl);
  }

  // 6. Save as official Court/Notary Faritha PDF file
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const documentFileName = EXPORT_FILENAME(rootDeceasedName, 'pdf', office.notaryNameAr);
  pdf.save(documentFileName);
}
