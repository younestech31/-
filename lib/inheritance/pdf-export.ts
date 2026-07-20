/* eslint-disable @typescript-eslint/no-explicit-any */
import { StageResult } from '@/components/inheritance/ResultsTable';
import Fraction from 'fraction.js';
import {
  COLOR_PALETTE,
  EXPORT_FONT_FAMILY,
  EXPORT_OFFICE_INFO,
  formatDocumentCurrency,
  EXPORT_TABLE_COLUMNS,
  EXPORT_FILENAME,
  OfficeSettings,
  DEFAULT_OFFICE_SETTINGS
} from './document-branding';

// Map canonical currency function
const formatCurrency = formatDocumentCurrency;

function deceasedPronoun(gender: 'male' | 'female' | null): string {
  return gender === 'female' ? 'المرحومة' : 'المرحوم';
}

// Utility to wrap text beautifully inside canvas cells
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine ? currentLine + ' ' + words[n] : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(currentLine);
      currentLine = words[n];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Draw a beautifully aligned cell with borders and wrap support on Canvas
function drawCanvasCell(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    fillColor?: string;
    strokeColor?: string;
    textColor?: string;
    font?: string;
    align?: CanvasTextAlign;
    direction?: CanvasDirection;
  } = {}
) {
  const {
    fillColor = COLOR_PALETTE.white,
    strokeColor = COLOR_PALETTE.border,
    textColor = '#000000',
    font = `bold 14px "${EXPORT_FONT_FAMILY}", sans-serif`,
    align = 'center',
    direction = 'rtl',
  } = options;

  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.direction = direction;

  const lines = wrapText(ctx, text, w - 16);
  
  // Dynamically estimate line height based on font size for crisp, non-overlapping layouts
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  const fontSize = match ? parseFloat(match[1]) : 14;
  const lineHeight = Math.ceil(fontSize * 1.35);
  const totalLineHeight = lines.length * lineHeight;
  
  // Perfectly center the text line block vertically within the cell height
  let startY = y + (h - totalLineHeight) / 2 + fontSize - 1;

  lines.forEach((line) => {
    let tx = x + w / 2;
    if (align === 'right') {
      tx = x + w - 10;
    } else if (align === 'left') {
      tx = x + 10;
    }
    ctx.fillText(line, tx, startY);
    startY += lineHeight;
  });
}

// High Resolution Canvas Page Renderer for a single StageResult
function renderStageToCanvas(
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
  logoImage?: HTMLImageElement | null
): HTMLCanvasElement {
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const { estate: globalEstate, debts: globalDebts, funeralCosts: globalFuneralCosts, bequest: globalBequest, deceasedGender } = params;
  const isPureMode = globalEstate === 0;

  const logicalWidth = 1240;
  const logicalHeight = 1754;

  // 1. Initialize High-Resolution A4 Canvas (300 DPI equivalent)
  const canvas = document.createElement('canvas');
  canvas.width = 2480;
  canvas.height = 3508;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D context for high resolution PDF render canvas');

  // Fill Background
  ctx.fillStyle = COLOR_PALETTE.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Scale context to draw in logical coordinates for easy maintenance and crisp outline vector-mapping
  ctx.scale(2, 2);

  // 2. Draw dual official emerald and gold border frame
  ctx.strokeStyle = COLOR_PALETTE.green; // Brand green for primary outline
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, logicalWidth - 60, logicalHeight - 60);

  ctx.strokeStyle = COLOR_PALETTE.border; // Soft grey inner border
  ctx.lineWidth = 1;
  ctx.strokeRect(41, 41, logicalWidth - 82, logicalHeight - 82);

  // 3. Draw Legal Headers
  ctx.fillStyle = COLOR_PALETTE.greenDark;
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';

  ctx.font = `bold 33px "${EXPORT_FONT_FAMILY}", "IBM Plex Sans Arabic", "Noto Naskh Arabic", Arial, sans-serif`;
  ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية', logicalWidth - 90, 105);

  ctx.font = `bold 24px "${EXPORT_FONT_FAMILY}", "IBM Plex Sans Arabic", sans-serif`;
  ctx.fillText('وزارة العدل', logicalWidth - 90, 150);

  ctx.font = `bold 28px "${EXPORT_FONT_FAMILY}", "IBM Plex Sans Arabic", sans-serif`;
  ctx.fillStyle = COLOR_PALETTE.green;
  ctx.fillText(`${office.officialDesignationAr} - ${office.notaryNameAr}`, logicalWidth - 90, 195);

  ctx.font = `bold 21px "${EXPORT_FONT_FAMILY}", "IBM Plex Sans Arabic", sans-serif`;
  ctx.fillStyle = COLOR_PALETTE.mutedText;
  ctx.fillText(`${office.addressAr} - ${office.titleAr}`, logicalWidth - 90, 235);

  // 4. Draw Logo on the left side of the header
  if (logoImage) {
    try {
      ctx.drawImage(logoImage, 90, 95, 140, 140);
    } catch (e) {
      console.error('Error drawing logo in PDF:', e);
    }
  }

  // 5. Drawing horizontal separation rule
  ctx.strokeStyle = COLOR_PALETTE.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 285);
  ctx.lineTo(logicalWidth - 80, 285);
  ctx.stroke();

  // 6. Centered Deed Title Box
  const pX = 80;
  const pY = 320;
  const pW = logicalWidth - 160;
  const pH = 110;

  ctx.fillStyle = COLOR_PALETTE.greenLight; // Gentle mint-light background
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(pX, pY, pW, pH, 12);
  } else {
    ctx.rect(pX, pY, pW, pH);
  }
  ctx.fill();

  ctx.strokeStyle = COLOR_PALETTE.green; // Brand green border
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_PALETTE.greenDark;
  ctx.font = `bold 32px "${EXPORT_FONT_FAMILY}", sans-serif`;

  if (stageIdx === 0) {
    ctx.fillText('وثيقة تصفية وتقسيم التركة الشرعية', logicalWidth / 2, pY + 44);
    ctx.font = `bold 19px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillStyle = COLOR_PALETTE.mutedText;
    ctx.fillText('مستخرج من المنظومة التوثيقية الرقمية - وفق أحكام قانون الأسرة الجزائري (الأمر 84-11)', logicalWidth / 2, pY + 82);
  } else {
    ctx.fillText(`المناسخة رقم ${stageIdx}: تصفية حصة الوارث المتوفى`, logicalWidth / 2, pY + 44);
    ctx.font = `bold 19px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillStyle = COLOR_PALETTE.mutedText;
    const deceasedName = stageResult.stage.deceasedName || `الوارث الفرعي رقم ${stageIdx}`;
    ctx.fillText(`توزيع نصيب المتوفى: ${deceasedName} إلى ورثته الخصوصيين`, logicalWidth / 2, pY + 82);
  }

  let currentY = 460;

  // 7. Legal Disclaimer Box (Only on Page 1)
  if (stageIdx === 0) {
    ctx.fillStyle = COLOR_PALETTE.redLight; // Unified red-light background
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(80, currentY, 1240 - 160, 140, 8);
    } else {
      ctx.rect(80, currentY, 1240 - 160, 140);
    }
    ctx.fill();

    ctx.strokeStyle = COLOR_PALETTE.red; // Brand alert red border
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    ctx.fillStyle = COLOR_PALETTE.red;
    ctx.font = `bold 19px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillText(EXPORT_OFFICE_INFO.disclaimerTitleAr, 1240 - 100, currentY + 32);

    ctx.fillStyle = '#7f1d1d'; // Safe high contrast dark red text
    ctx.font = `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`;
    const disclaimerText = EXPORT_OFFICE_INFO.disclaimerTextAr;
    
    // Auto-wrap disclaimer text nicely
    const disLines = wrapText(ctx, disclaimerText, 1240 - 200);
    let lineY = currentY + 62;
    disLines.forEach((l) => {
      ctx.fillText(l, 1240 - 100, lineY);
      lineY += 26;
    });

    currentY += 160;
  }

  // 8. Deceased Name Banner
  ctx.fillStyle = COLOR_PALETTE.slateLight; // Elegant grey slate background
  ctx.strokeStyle = COLOR_PALETTE.green;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(80, currentY, 1240 - 160, 55, 6);
  } else {
    ctx.rect(80, currentY, 1240 - 160, 55);
  }
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_PALETTE.greenDark;
  ctx.font = `bold 21px "${EXPORT_FONT_FAMILY}", sans-serif`;
  const dPronoun = deceasedPronoun(deceasedGender);
  const dName = stageResult.stage.deceasedName?.trim() || dPronoun;

  if (stageIdx === 0) {
    ctx.fillText(`مسألة تركة ${dPronoun}: ${dName}`, 1240 / 2, currentY + 34);
  } else {
    ctx.fillText(`تصفية تركة الوارث الفرعي المتوفى: ${dName}`, 1240 / 2, currentY + 34);
  }

  currentY += 80;

  // 9. Pre-liquidation statistics table (Page 1 static overview if not pure mode)
  if (stageIdx === 0) {
    if (isPureMode) {
      ctx.fillStyle = COLOR_PALETTE.white;
      ctx.strokeStyle = COLOR_PALETTE.green;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(80, currentY, 1240 - 160, 45);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.fillStyle = COLOR_PALETTE.greenDark;
      ctx.font = `bold 16px "${EXPORT_FONT_FAMILY}", sans-serif`;
      ctx.fillText('نمط التصفية النظرية (النسب والمقادير): تم تفعيل الميزان الشرعي الفرضي لتحديد الورثة ونسب السهام الشرعية.', 1240 - 100, currentY + 28);
      currentY += 65;
    } else {
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.fillStyle = COLOR_PALETTE.greenDark;
      ctx.font = `bold 20px "${EXPORT_FONT_FAMILY}", sans-serif`;
      ctx.fillText('أولاً: ملخص التركة والاستقطاعات والديون الشرعية (قبل القسمة)', 1240 - 80, currentY);
      currentY += 20;

      const tblX = 80;
      const tblW = 1240 - 160;
      const colW = tblW / 5;
      const headers = ['صافي التركة الموزعة', 'الوصايا الشرعية', 'تكاليف تجهيز الجنازة', 'الديون والتبعات الوفائية', 'التركة الإجمالية'];
      const values = [
        formatCurrency(stageResult.netEstate ?? 0),
        formatCurrency(globalBequest),
        formatCurrency(globalFuneralCosts),
        formatCurrency(globalDebts),
        formatCurrency(globalEstate),
      ];

      for (let cCol = 0; cCol < 5; cCol++) {
        const cX = tblX + (4 - cCol) * colW;
        // Header cell in brand green
        ctx.fillStyle = COLOR_PALETTE.green;
        ctx.fillRect(cX, currentY, colW, 45);
        ctx.strokeStyle = COLOR_PALETTE.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(cX, currentY, colW, 45);

        ctx.fillStyle = COLOR_PALETTE.white;
        ctx.textAlign = 'center';
        ctx.font = `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`;
        ctx.fillText(headers[cCol], cX + colW / 2, currentY + 28);

        // Value cell
        ctx.fillStyle = COLOR_PALETTE.white;
        ctx.fillRect(cX, currentY + 45, colW, 45);
        ctx.strokeRect(cX, currentY + 45, colW, 45);

        ctx.fillStyle = '#000000';
        ctx.font = `bold 16px "${EXPORT_FONT_FAMILY}", sans-serif`;
        ctx.fillText(values[cCol], cX + colW / 2, currentY + 73);
      }

      currentY += 115;
    }
  }

  // 10. Draw Division Section Heading
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.fillStyle = COLOR_PALETTE.greenDark;
  ctx.font = `bold 20px "${EXPORT_FONT_FAMILY}", sans-serif`;
  if (stageIdx === 0) {
    ctx.fillText('ثانياً: جدول توزيع السهام والحصص على الورثة المستحقين فريضة', 1240 - 80, currentY);
  } else {
    ctx.fillText('توزيع السهام والحصص الشرعية لهذه المناسخة', 1240 - 80, currentY);
  }
  currentY += 20;

  // 11. Correction Problem Base Indicator
  const firstValidForBase = stageResult.results.find(
    r => !r.isBlocked && r.heirId !== 'mandatory_bequest' && r.heirId !== 'voluntary_bequest'
  );
  const stageProblemBase = firstValidForBase?.problemBase ?? null;

  ctx.fillStyle = COLOR_PALETTE.slateLight;
  ctx.fillRect(80, currentY, 1240 - 160, 44);
  ctx.strokeStyle = COLOR_PALETTE.green;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(80, currentY, 1240 - 160, 44);

  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.fillStyle = COLOR_PALETTE.greenDark;
  ctx.font = `bold 18px "${EXPORT_FONT_FAMILY}", sans-serif`;
  ctx.fillText(`أصل المسألة التصحيحي الشرعي: ${stageProblemBase ?? '-'}`, 1240 - 95, currentY + 28);

  if (stageIdx > 0 && !isPureMode) {
    ctx.textAlign = 'left';
    ctx.direction = 'ltr';
    ctx.fillText(`حصة التصفية للمناسخة: ${formatCurrency(stageResult.netEstate)}`, 95, currentY + 28);
  }
  currentY += 56;

  // 12. Alert banner for Awl or Radd
  const calcType = stageResult.results[0]?.calculationType;
  if (calcType && calcType !== 'normal') {
    const alertText = calcType === 'awl'
      ? '● عول (المادة 166): تم تطبيق ضوابط العول ونقل السهام الشرعية لتوزيع النقص بالعدل.'
      : '● رد (المادة 167): تم تطبيق رد الفائض بالكامل على ذوي الفروض الشرعية غير الزوجين.';
    
    ctx.fillStyle = calcType === 'awl' ? COLOR_PALETTE.awlBg : COLOR_PALETTE.raddBg;
    ctx.fillRect(80, currentY, 1240 - 160, 44);
    ctx.strokeStyle = COLOR_PALETTE.border;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(80, currentY, 1240 - 160, 44);

    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    ctx.fillStyle = '#000000';
    ctx.font = `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillText(alertText, 1240 - 95, currentY + 27);
    currentY += 54;
  }

  // 13. Draw Main Division Grid Header from EXPORT_TABLE_COLUMNS
  const tblX = 80;
  const colWidths = [110, 230, 110, 130, 300, 200];
  const colStarts = [
    tblX, 
    tblX + 110, 
    tblX + 110 + 230, 
    tblX + 110 + 230 + 110, 
    tblX + 110 + 230 + 110 + 130, 
    tblX + 110 + 230 + 110 + 130 + 300
  ];
  
  const headers = [
    EXPORT_TABLE_COLUMNS[5].label,
    isPureMode ? EXPORT_TABLE_COLUMNS[4].labelPure : EXPORT_TABLE_COLUMNS[4].label,
    EXPORT_TABLE_COLUMNS[3].label,
    EXPORT_TABLE_COLUMNS[2].label,
    EXPORT_TABLE_COLUMNS[1].label,
    EXPORT_TABLE_COLUMNS[0].label,
  ];
  const cellH = 44;

  for (let c = 0; c < 6; c++) {
    drawCanvasCell(ctx, headers[c], colStarts[c], currentY, colWidths[c], cellH, {
      fillColor: COLOR_PALETTE.green, // Brand green main table header
      strokeColor: COLOR_PALETTE.border,
      textColor: COLOR_PALETTE.white,
      font: `bold 15.5px "${EXPORT_FONT_FAMILY}", sans-serif`,
      align: 'center'
    });
  }
  currentY += cellH;

  // 14. Add Grid Rows
  const results = stageResult.results;
  const stage = stageResult.stage;
  const bequests = results.filter(r => !r.isBlocked && (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest'));
  const inheritors = results.filter(r => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');

  const drawRow = (rowCells: string[], textColorParams?: (string | null)[], aligns?: CanvasTextAlign[], fillColor: string = COLOR_PALETTE.white) => {
    for (let c = 0; c < 6; c++) {
      drawCanvasCell(ctx, rowCells[c], colStarts[c], currentY, colWidths[c], cellH, {
        fillColor: fillColor,
        strokeColor: COLOR_PALETTE.border,
        textColor: textColorParams?.[c] || '#000000',
        font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`,
        align: aligns?.[c] || 'center'
      });
    }
    currentY += cellH;
  };

  // Render Bequests rows in soft amber
  bequests.forEach((b) => {
    const typeLabel = b.heirId === 'mandatory_bequest' ? 'تنزيل (وصية واجبة)' : 'وصية اختيارية';
    const bPct = b.shareFraction.valueOf() * 100;
    const bPctStr = bPct > 0 ? (bPct % 1 === 0 ? `${bPct}%` : `${bPct.toFixed(2)}%`) : '0%';
    const valStr = isPureMode ? bPctStr : `${formatCurrency(b.amount)} (${bPctStr})`;
    const artText = b.article ? `م ${b.article}` : 'م 169';

    drawRow(
      [artText, valStr, '-', b.share, typeLabel, b.nameAr],
      [null, '#000000', null, null, null, null],
      ['center', 'center', 'center', 'center', 'right', 'center'],
      COLOR_PALETTE.bequestRow
    );
  });

  // Render Inheritor rows with alternating light mint rows
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

      const individualAmt = indResult ? indResult.amount : (r.amount / r.count);
      const indShare = indResult ? indResult.share : r.share;
      const indSharesText = indResult ? String(indResult.shares) : String(r.shares > 0 ? (r.shares / r.count) : 0);

      const indShareFrac = indResult && indResult.shareFraction ? indResult.shareFraction : (r.shareFraction.compare(0) === 0 ? new Fraction(0) : r.shareFraction.div(r.count));
      const indPct = indShareFrac.valueOf() * 100;
      const indPctStr = indPct > 0 ? (indPct % 1 === 0 ? `${indPct}%` : `${indPct.toFixed(2)}%`) : '0%';
      const valStr = isPureMode ? indPctStr : `${formatCurrency(individualAmt)} (${indPctStr})`;
      const reason = indResult ? indResult.reason : r.reason;
      const artText = r.article ? `م ${r.article}` : '-';

      const rowBg = rowIndex % 2 === 0 ? COLOR_PALETTE.white : COLOR_PALETTE.mint;

      drawRow(
        [artText, valStr, indSharesText, indShare, reason, displayName],
        [null, '#000000', null, null, null, null],
        ['center', 'center', 'center', 'center', 'right', 'center'],
        rowBg
      );
      rowIndex++;
    }
  });

  // Render Totals Row in bold brand green
  drawCanvasCell(ctx, '-', colStarts[0], currentY, colWidths[0], cellH, { fillColor: COLOR_PALETTE.green, strokeColor: COLOR_PALETTE.border, textColor: COLOR_PALETTE.white });
  drawCanvasCell(ctx, isPureMode ? '100%' : `${formatCurrency(stageResult.netEstate)} (100%)`, colStarts[1], currentY, colWidths[1], cellH, {
    fillColor: COLOR_PALETTE.green,
    strokeColor: COLOR_PALETTE.border,
    textColor: COLOR_PALETTE.white,
    font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`
  });
  drawCanvasCell(ctx, String(stageProblemBase ?? '-'), colStarts[2], currentY, colWidths[2], cellH, { 
    fillColor: COLOR_PALETTE.green, 
    strokeColor: COLOR_PALETTE.border,
    textColor: COLOR_PALETTE.white,
    font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif` 
  });
  drawCanvasCell(ctx, '-', colStarts[3], currentY, colWidths[3], cellH, { fillColor: COLOR_PALETTE.green, strokeColor: COLOR_PALETTE.border, textColor: COLOR_PALETTE.white });

  const mergedW = colWidths[4] + colWidths[5];
  drawCanvasCell(ctx, 'المجموع الكلي للحصص والسهام المصححة للمسألة', colStarts[4], currentY, mergedW, cellH, {
    fillColor: COLOR_PALETTE.green,
    strokeColor: COLOR_PALETTE.border,
    textColor: COLOR_PALETTE.white,
    align: 'right',
    font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`
  });
  currentY += cellH + 20;

  // 15. Render Treasury Redistribution (if any)
  if (stageResult.noHeirsRedistribution && stageResult.noHeirsRedistribution.policy === 'treasury') {
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    ctx.fillStyle = COLOR_PALETTE.greenDark;
    ctx.font = `bold 18px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillText('مستحقات الخزينة العمومية للدولة (المادة 180):', 1240 - 80, currentY);
    currentY += 15;

    const tW = [250, 580, 250];
    const tX = [tblX, tblX + 250, tblX + 250 + 580];

    // Treasury Header in emerald green
    const tHeaders = ['الحصة وإجمالي الأموال الشاغرة', 'السبب الدستوري والقانوني', 'الجهة المستحقة'];
    for (let col = 0; col < 3; col++) {
      drawCanvasCell(ctx, tHeaders[col], tX[col], currentY, tW[col], cellH, {
        fillColor: COLOR_PALETTE.green,
        textColor: COLOR_PALETTE.white,
        font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`,
        align: col === 1 ? 'right' : 'center'
      });
    }
    currentY += cellH;

    // Treasury values row in light blue
    const tVals = [formatCurrency(stageResult.noHeirsRedistribution.amount), stageResult.noHeirsRedistribution.messageAr, 'مديرية أملاك الدولة / الخزينة العامة'];
    for (let col = 0; col < 3; col++) {
      drawCanvasCell(ctx, tVals[col], tX[col], currentY, tW[col], cellH, {
        fillColor: COLOR_PALETTE.treasuryBg,
        textColor: '#000000',
        font: col === 0 ? `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif` : `bold 14px "${EXPORT_FONT_FAMILY}", sans-serif`,
        align: col === 1 ? 'right' : 'center'
      });
    }
    currentY += cellH + 20;
  }

  // 16. Render Blocked or Excluded Heirs
  const blockedRows: any[] = [];
  const possibleBlocked = results.filter(r => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');
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
      const reason = indResult ? indResult.reason : (bh.reason || 'محجوب لتواجد وارث أقرب أحق بفرض الحجب');
      const artText = bh.article ? `م ${bh.article}` : '-';

      blockedRows.push({ name: displayName, reason, article: artText });
    }
  });

  if (blockedRows.length > 0) {
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    ctx.fillStyle = COLOR_PALETTE.greenDark;
    ctx.font = `bold 18px "${EXPORT_FONT_FAMILY}", sans-serif`;
    ctx.fillText('الأقارب والورثة المحجوبون أو المستبعدون بموجب أحكام الميراث:', 1240 - 80, currentY);
    currentY += 15;

    const bW = [180, 650, 250];
    const bX = [tblX, tblX + 180, tblX + 180 + 650];

    // Blocked header in bold red
    const bHeaders = ['المستند القانوني', 'سبب ومستند الحجب / الاستبعاد الفرضي من الميراث', 'الاسم والصلة'];
    for (let col = 0; col < 3; col++) {
      drawCanvasCell(ctx, bHeaders[col], bX[col], currentY, bW[col], cellH, {
        fillColor: COLOR_PALETTE.red,
        textColor: COLOR_PALETTE.white,
        font: `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`,
        align: col === 1 ? 'right' : 'center'
      });
    }
    currentY += cellH;

    // Blocked rows in light red background
    blockedRows.forEach((row) => {
      const rowVals = [row.article, row.reason, row.name];
      for (let col = 0; col < 3; col++) {
        drawCanvasCell(ctx, rowVals[col], bX[col], currentY, bW[col], cellH, {
          fillColor: COLOR_PALETTE.blockedRow,
          textColor: '#000000',
          font: `bold 14px "${EXPORT_FONT_FAMILY}", sans-serif`,
          align: col === 1 ? 'right' : 'center'
        });
      }
      currentY += cellH;
    });
    currentY += 20;
  }

  // Address strip footer
  const addressY = 1630;
  ctx.fillStyle = COLOR_PALETTE.white;
  ctx.fillRect(80, addressY, 1240 - 160, 60);

  ctx.strokeStyle = COLOR_PALETTE.green;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(80, addressY, 1240 - 160, 60);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = `bold 15px "${EXPORT_FONT_FAMILY}", sans-serif`;
  const footerText = `العنوان: ${office.addressAr} | هاتف: ${office.phone} | صادر عبر منصة مواريث الرقمية (mawarith.dz)`;
  const footerPageLabel = `الأستاذ الموثق ${office.notaryNameAr} | صفحة ${stageIdx + 1} من ${totalStages}`;
  ctx.fillText(footerText, 1240 / 2, addressY + 24);
  ctx.fillText(footerPageLabel, 1240 / 2, addressY + 44);

  return canvas;
}

// Master Export Function called by client actions
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
  const { jsPDF } = await import('jspdf');

  const rootStage = allStagesResults[0];
  const deceasedGender = params.deceasedGender;
  const rootDeceasedName = rootStage?.stage.deceasedName?.trim() || deceasedPronoun(deceasedGender);

  // Prefetch logo image for drawing in the PDF header
  let logoImage: HTMLImageElement | null = null;
  try {
    logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load logo image'));
      img.src = '/logos/icon-color-512.png';
    });
  } catch (err) {
    console.error('Failed to prefetch logo for PDF:', err);
  }

  // 1. Initialize empty jsPDF project document
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // 2. Loop through each stage result and composite onto high-res canvas
  for (let idx = 0; idx < allStagesResults.length; idx++) {
    const stageResult = allStagesResults[idx];
    const canvas = renderStageToCanvas(stageResult, idx, allStagesResults.length, params, officeSettings, logoImage);

    // Convert high fidelity canvas to a lossless PNG image block to maintain pixel-perfect non-blurry text sharpness
    const imageURI = canvas.toDataURL('image/png');

    if (idx > 0) {
      pdf.addPage();
    }

    // Embed the canvas layout image to perfectly fill A4 sheet area with PNG compression to ensure maximum print sharpness
    pdf.addImage(imageURI, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  // 3. Save as formal printable court-ready Faritha PDF file using EXPORT_FILENAME
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const documentFileName = EXPORT_FILENAME(rootDeceasedName, 'pdf', office.notaryNameAr);
  pdf.save(documentFileName);
}
