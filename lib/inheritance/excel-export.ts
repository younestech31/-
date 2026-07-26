import type { StageResult } from '@/components/inheritance/ResultsTable';
import type ExcelJS from 'exceljs';
import {
  COLOR_PALETTE,
  toExcelArgb,
  EXPORT_FONT_FAMILY,
  EXPORT_OFFICE_INFO,
  EXPORT_EXCEL_NUM_FMT,
  EXPORT_TABLE_COLUMNS,
  EXPORT_FILENAME,
  formatDocumentCurrency,
  OfficeSettings,
  DEFAULT_OFFICE_SETTINGS
} from './document-branding';

const COLOR = {
  headerBg:    toExcelArgb(COLOR_PALETTE.green),
  headerFg:    toExcelArgb(COLOR_PALETTE.white),
  altRow:      toExcelArgb(COLOR_PALETTE.mint),
  bequestRow:  toExcelArgb(COLOR_PALETTE.bequestRow),
  blockedRow:  toExcelArgb(COLOR_PALETTE.blockedRow),
  treasuryRow: toExcelArgb(COLOR_PALETTE.treasuryBg),
  border:      toExcelArgb(COLOR_PALETTE.border),
  awlBg:       toExcelArgb(COLOR_PALETTE.awlBg),
  raddBg:      toExcelArgb(COLOR_PALETTE.raddBg),
  mutedText:   toExcelArgb(COLOR_PALETTE.mutedText),
} as const;

export async function exportToExcel(
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
  const office = officeSettings || DEFAULT_OFFICE_SETTINGS;
  const {
    estate: globalEstate,
    debts: globalDebts,
    funeralCosts: globalFuneralCosts,
    bequest: globalBequest,
    deceasedGender
  } = params;

  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  // Helper styles
  function solidFill(argb: string): ExcelJS.Fill {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
  }

  function thinBorders(argb: string = COLOR.border): Partial<ExcelJS.Borders> {
    const side = { style: 'thin' as const, color: { argb } };
    return { top: side, bottom: side, left: side, right: side };
  }

  function styleHeader(cell: ExcelJS.Cell, bold = true): void {
    cell.font = {
      bold,
      size: 11,
      color: { argb: COLOR.headerFg },
      name: EXPORT_FONT_FAMILY
    };
    cell.fill = solidFill(COLOR.headerBg);
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
      readingOrder: 'rtl'
    };
    cell.border = thinBorders();
  }

  function styleData(
    cell: ExcelJS.Cell,
    opts: {
      argbBg?  : string;
      bold?    : boolean;
      hAlign?  : ExcelJS.Alignment['horizontal'];
      numFmt?  : string;
      readingOrder? : ExcelJS.Alignment['readingOrder'];
    } = {}
  ): void {
    const { argbBg, bold = false, hAlign = 'right', numFmt, readingOrder = 'rtl' } = opts;
    cell.font = {
      size: 10,
      name: EXPORT_FONT_FAMILY,
      bold,
      color: { argb: 'FF1E293B' }
    };
    cell.fill = solidFill(argbBg ?? 'FFFFFFFF');
    cell.alignment = {
      horizontal: hAlign,
      vertical: 'middle',
      wrapText: true,
      readingOrder
    };
    cell.border = thinBorders();
    if (numFmt) cell.numFmt = numFmt;
  }

  function fmtShares(v: number): string {
    if (v <= 0) return '-';
    const s = v.toFixed(3).replace(/\.?0+$/, '');
    return s || '-';
  }

  const rootStage = allStagesResults[0];
  const rootName = rootStage?.stage.deceasedName?.trim()
                 || (deceasedGender === 'female' ? 'المرحومة' : 'المرحوم');

  const isPureMode = globalEstate === 0;

  // Metadata
  workbook.creator = 'حاسبة الميراث الرقمية — الجزائر';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = `تركة ${rootName}`;
  workbook.subject = 'قسمة الميراث وفق قانون الأسرة الجزائري (الأمر 84-11)';

  // ── 1. COVER SHEET "ملخص التركة" ──
  const wsCover = workbook.addWorksheet('ملخص التركة');
  wsCover.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
  wsCover.columns = [
    { key: 'label', header: 'البند', width: 35 },
    { key: 'value', header: 'القيمة / التوضيح', width: 55 },
  ];

  const coverHeaderRow = wsCover.getRow(1);
  coverHeaderRow.height = 22;
  coverHeaderRow.eachCell({ includeEmpty: true }, (cell) => styleHeader(cell));

  const coverRows: Array<[string, string | number]> = isPureMode ? [
    ['مكتب التوثيق',                 `${office.officialDesignationAr} ${office.notaryNameAr}`],
    ['العنوان والهاتف',               `${office.addressAr} - ${office.phone}`],
    ['منصة الإصدار والاعتماد',       'منصة مواريث الرقمية للمواريث والتركات (mawarith.dz)'],
    ['اسم المتوفى',                  rootName],
    ['الجنس',                        deceasedGender === 'female' ? 'أنثى' : 'ذكر'],
    ['نمط التصفية',                  'حساب الحصص والسهام والنسب المئوية نظرياً (بدون تركة مالية)'],
    ['عدد مراحل المناسخة',            allStagesResults.length - 1],
    ['تاريخ الإصدار',
      new Date().toLocaleDateString('ar-DZ',
        { year: 'numeric', month: 'long', day: 'numeric' })],
    ['تنبيه قانوني هام',             EXPORT_OFFICE_INFO.disclaimerTextAr]
  ] : [
    ['مكتب التوثيق',                 `${office.officialDesignationAr} ${office.notaryNameAr}`],
    ['العنوان والهاتف',               `${office.addressAr} - ${office.phone}`],
    ['منصة الإصدار والاعتماد',       'منصة مواريث الرقمية للمواريث والتركات (mawarith.dz)'],
    ['اسم المتوفى',                  rootName],
    ['الجنس',                        deceasedGender === 'female' ? 'أنثى' : 'ذكر'],
    ['إجمالي التركة (دج)',            globalEstate],
    ['الديون (دج)',                   globalDebts],
    ['مصاريف الجنازة (دج)',           globalFuneralCosts],
    ...(globalBequest > 0
      ? [['الوصية الاختيارية (دج)', globalBequest] as [string, number]]
      : []),
    ['صافي التركة للتوزيع (دج)',      rootStage?.netEstate ?? 0],
    ['عدد مراحل المناسخة',            allStagesResults.length - 1],
    ['تاريخ الإصدار',
      new Date().toLocaleDateString('ar-DZ',
        { year: 'numeric', month: 'long', day: 'numeric' })],
    ['تنبيه قانوني هام',             EXPORT_OFFICE_INFO.disclaimerTextAr]
  ];

  coverRows.forEach(([label, value]) => {
    const row = wsCover.addRow({ label, value });
    const cellLabel = row.getCell(1);
    const cellValue = row.getCell(2);

    if (label === 'تنبيه قانوني هام') {
      row.height = 90;
      styleData(cellLabel, { argbBg: toExcelArgb(COLOR_PALETTE.redLight), bold: true });
      styleData(cellValue, { argbBg: toExcelArgb(COLOR_PALETTE.redLight), hAlign: 'right' });
      cellValue.font = {
        name: EXPORT_FONT_FAMILY,
        size: 9.5,
        color: { argb: toExcelArgb(COLOR_PALETTE.red) },
        bold: false
      };
    } else if (label === 'مكتب التوثيق' || label === 'العنوان والهاتف' || label === 'منصة الإصدار والاعتماد') {
      row.height = 24;
      styleData(cellLabel, { argbBg: toExcelArgb(COLOR_PALETTE.greenLight), bold: true });
      styleData(cellValue, { argbBg: toExcelArgb(COLOR_PALETTE.greenLight), bold: true, hAlign: 'right' });
    } else {
      row.height = 20;
      const isCurrency = typeof value === 'number' && String(label).includes('دج');
      styleData(cellLabel, { argbBg: 'FFF8FAFC', hAlign: 'right' });
      styleData(cellValue, {
        argbBg: 'FFFFFFFF',
        hAlign: 'center',
        numFmt: isCurrency ? EXPORT_EXCEL_NUM_FMT : undefined,
        readingOrder: (typeof value === 'number' || String(label).includes('تاريخ')) ? 'ltr' : 'rtl',
      });
    }
  });

  // ── 2. STAGES WORKBOOK GENERATION ──
  allStagesResults.forEach((stageResult, idx) => {
    const { stage, results, netEstate, noHeirsRedistribution } = stageResult;
    const prefix = idx === 0 ? 'م.الأصلية' : `م.${idx}`;
    const stageProblemBase = results[0]?.problemBase ?? null;

    // Bequests (voluntary / mandatory)
    const bequests = results.filter(
      (r) => !r.isBlocked && (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest')
    );

    // FlatMap active heirs
    const activeHeirs = results
      .filter((r) => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest')
      .flatMap((r) => {
        const presence = stage.heirPresence[r.heirId];
        const customNames = presence?.customNames;
        const individualRows = [];

        for (let i = 0; i < r.count; i++) {
          const indResult = r.individuals?.[i];
          const isBlocked = indResult ? indResult.isBlocked : r.isBlocked;
          if (isBlocked) continue;

          const customName = customNames?.[i];
          const baseName = r.count > 1 ? `${r.nameAr} (${i + 1})` : r.nameAr;
          const displayName = customName ? `${customName} (${r.nameAr})` : baseName;

          const individualAmt = indResult ? indResult.amount : (r.amount / r.count);
          const indShare = indResult
            ? indResult.share
            : r.count > 1 && r.shareFraction
              ? r.shareFraction.div(r.count).toFraction(true)
              : r.share;
          const indShares = indResult ? indResult.shares : (r.shares > 0 && stageProblemBase !== null ? (r.shares / r.count) : 0);

          individualRows.push({
            displayName,
            reason: indResult ? indResult.reason : r.reason,
            share: indShare,
            shares: indShares,
            amount: individualAmt,
            article: r.article ? `${r.article}` : '',
            shareDecimal: indResult?.shareFraction ? indResult.shareFraction.valueOf() : (r.shareDecimal / r.count),
          });
        }
        return individualRows;
      });

    // ── a. HEIRS WORKSHEET (الورثة) ──
    const ws1 = workbook.addWorksheet(`${prefix} — الورثة`);
    ws1.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
    
    // Dynamic columns from EXPORT_TABLE_COLUMNS
    ws1.columns = EXPORT_TABLE_COLUMNS.map((col) => {
      const width = col.key === 'name' ? 24 :
                    col.key === 'role' ? 36 :
                    col.key === 'share' ? 16 :
                    col.key === 'parts' ? 12 :
                    col.key === 'percentage' ? 14 :
                    col.key === 'amount' ? 22 : 16;
      return { key: col.key, header: col.label, width };
    });

    // Format headers
    const ws1HeaderRow = ws1.getRow(1);
    ws1HeaderRow.height = 22;
    ws1HeaderRow.eachCell({ includeEmpty: true }, (cell) => styleHeader(cell));

    // Calc Notices (AWL / RADD)
    const calcType = results[0]?.calculationType;
    if (calcType === 'awl' || calcType === 'radd') {
      const noticeText = calcType === 'awl'
        ? 'عول (م.166): أصل المسألة وُسِّع لاستيعاب جميع الفروض الشرعية'
        : 'رد (م.167): الفائض الشاغر رُدَّ على أصحاب الفروض بالنسبة';
      const noticeRow = ws1.addRow({
        name: noticeText, role: '', share: '', parts: '', percentage: '', amount: '', article: ''
      });
      noticeRow.height = 18;
      ws1.mergeCells(`A${noticeRow.number}:G${noticeRow.number}`);
      noticeRow.eachCell({ includeEmpty: true }, (cell) => {
        styleData(cell, {
          argbBg: calcType === 'awl' ? COLOR.awlBg : COLOR.raddBg,
          bold: true,
          hAlign: 'center',
        });
      });
    }

    // Write bequests
    bequests.forEach((b) => {
      const bPct = b.shareFraction.valueOf() * 100;
      const bPctStr = bPct > 0 ? (bPct % 1 === 0 ? `${bPct}%` : `${bPct.toFixed(2)}%`) : '0%';
      const amtVal = isPureMode ? 0 : b.amount;

      const row = ws1.addRow({
        name: b.nameAr,
        role: 'وصية (تخرج قبل القسمة)',
        share: b.share,
        parts: '-',
        percentage: bPctStr,
        amount: amtVal,
        article: b.article ? `م ${b.article}` : 'م 184',
      });
      row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const isAmountCol = colNum === 6;
        styleData(cell, {
          argbBg: COLOR.bequestRow,
          hAlign: colNum <= 2 ? 'right' : 'center',
          numFmt: isAmountCol && !isPureMode ? EXPORT_EXCEL_NUM_FMT : undefined,
          readingOrder: colNum >= 3 && colNum <= 6 ? 'ltr' : 'rtl',
        });
      });
    });

    // Write active heirs
    let rowIndex = 0;
    activeHeirs.forEach((h) => {
      const bgColor = rowIndex % 2 === 0 ? 'FFFFFFFF' : COLOR.altRow;
      const hPct = h.shareDecimal * 100;
      const hPctStr = hPct > 0 ? (hPct % 1 === 0 ? `${hPct}%` : `${hPct.toFixed(2)}%`) : '0%';
      const individualAmt = isPureMode ? 0 : (h.amount ?? 0);

      const row = ws1.addRow({
        name: h.displayName,
        role: h.reason,
        share: h.share,
        parts: fmtShares(h.shares),
        percentage: hPctStr,
        amount: individualAmt,
        article: h.article ? `م ${h.article}` : '',
      });
      row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const isAmountCol = colNum === 6;
        styleData(cell, {
          argbBg: bgColor,
          hAlign: colNum <= 2 ? 'right' : 'center',
          numFmt: isAmountCol && !isPureMode ? EXPORT_EXCEL_NUM_FMT : undefined,
          readingOrder: colNum >= 3 && colNum <= 6 ? 'ltr' : 'rtl',
        });
      });
      rowIndex++;
    });

    // Total row
    const totalAmt = ws1.addRow({
      name: 'المجموع الكلي',
      role: '',
      share: '',
      parts: stageProblemBase ?? '-',
      percentage: '100%',
      amount: isPureMode ? 0 : netEstate,
      article: '',
    });
    totalAmt.height = 22;
    totalAmt.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isAmountCol = colNum === 6;
      styleData(cell, {
        argbBg: COLOR.headerBg,
        bold: true,
        hAlign: colNum <= 2 ? 'right' : 'center',
        numFmt: isAmountCol && !isPureMode ? EXPORT_EXCEL_NUM_FMT : undefined,
        readingOrder: colNum >= 3 && colNum <= 6 ? 'ltr' : 'rtl',
      });
      cell.font = {
        bold: true,
        size: 10,
        name: EXPORT_FONT_FAMILY,
        color: { argb: COLOR.headerFg }
      };
    });

    // Treasury row (no heirs)
    if (noHeirsRedistribution && noHeirsRedistribution.policy === 'treasury') {
      const tPct = 100;
      const tPctStr = tPct % 1 === 0 ? `${tPct}%` : `${tPct.toFixed(2)}%`;
      const valStr = isPureMode ? tPctStr : `${formatDocumentCurrency(noHeirsRedistribution.amount)} (${tPctStr})`;

      const treasuryRow = ws1.addRow({
        name: 'الخزينة العمومية',
        role: noHeirsRedistribution.messageAr,
        share: '1/1',
        parts: '-',
        amount: valStr,
        article: 'م 180',
      });
      treasuryRow.height = 20;
      treasuryRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        styleData(cell, {
          argbBg: COLOR.treasuryRow,
          hAlign: colNum <= 2 ? 'right' : 'center',
          numFmt: undefined,
          readingOrder: colNum >= 3 && colNum <= 5 ? 'ltr' : 'rtl',
        });
      });
    }

    // ── b. BLOCKED HEIRS WORKSHEET (المحجوبون) ──
    const blockedData = results
      .flatMap((r) => {
        if (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest') return [];

        const presence = stage.heirPresence[r.heirId];
        const customNames = presence?.customNames;
        const individualRows = [];

        for (let i = 0; i < r.count; i++) {
          const indResult = r.individuals?.[i];
          const isBlocked = indResult ? indResult.isBlocked : r.isBlocked;
          if (!isBlocked) continue;

          const customName = customNames?.[i];
          const baseName = r.count > 1 ? `${r.nameAr} (${i + 1})` : r.nameAr;
          const displayName = customName ? `${customName} (${r.nameAr})` : baseName;

          individualRows.push({
            name: displayName,
            reason: indResult ? indResult.reason : (r.reason || 'محجوب'),
            article: r.article ? `م ${r.article}` : '-',
          });
        }
        return individualRows;
      });

    if (blockedData.length > 0) {
      const ws3 = workbook.addWorksheet(`${prefix} — المحجوبون`);
      ws3.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
      ws3.columns = [
        { key: 'name',    header: 'الوارث المحجوب', width: 26 },
        { key: 'reason',  header: 'سبب الحجب',       width: 52 },
        { key: 'article', header: 'المادة',           width: 14 },
      ];

      const ws3HeaderRow = ws3.getRow(1);
      ws3HeaderRow.height = 22;
      ws3HeaderRow.eachCell({ includeEmpty: true }, (cell) => {
        styleHeader(cell);
        cell.fill = solidFill('FFB91C1C'); // Red header for blocked table
      });

      blockedData.forEach((item) => {
        const row = ws3.addRow({
          name: item.name,
          reason: item.reason,
          article: item.article,
        });
        row.height = 20;
        row.eachCell({ includeEmpty: true }, (cell) => {
          styleData(cell, { argbBg: COLOR.blockedRow });
        });
      });
    }
  });

  // Active cover template
  workbook.views = [{
    activeTab: 0,
    x: 0,
    y: 0,
    width: 10000,
    height: 10000,
    firstSheet: 0,
    visibility: 'visible'
  }];

  // File download triggering
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const fileName = EXPORT_FILENAME(rootName, 'xlsx', office.notaryNameAr);

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
