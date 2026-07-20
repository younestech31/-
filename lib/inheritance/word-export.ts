import type { StageResult } from '@/components/inheritance/ResultsTable';
import Fraction from 'fraction.js';
import type { TextRun, Paragraph, TableCell, FileChild } from 'docx';
import {
  COLOR_PALETTE,
  toDocxHex,
  EXPORT_FONT_FAMILY,
  EXPORT_OFFICE_INFO,
  formatDocumentCurrency,
  EXPORT_TABLE_COLUMNS,
  EXPORT_FILENAME,
  OfficeSettings,
  DEFAULT_OFFICE_SETTINGS
} from './document-branding';

type DocxAlignment = 'left' | 'right' | 'center' | 'both' | 'distribute'
  | 'thaiDistribute' | 'numTab' | 'highKashida' | 'kashida' | 'lowKashida'
  | 'end' | 'start' | 'mediumKashida';

const BRAND = {
  green:      toDocxHex(COLOR_PALETTE.green),
  greenDark:  toDocxHex(COLOR_PALETTE.greenDark),
  greenLight: toDocxHex(COLOR_PALETTE.greenLight),
  white:      toDocxHex(COLOR_PALETTE.white),
  red:        toDocxHex(COLOR_PALETTE.red),
  redLight:   toDocxHex(COLOR_PALETTE.redLight),
  amber:      toDocxHex(COLOR_PALETTE.amber),
  amberLight: toDocxHex(COLOR_PALETTE.amberLight),
  slateLight: toDocxHex(COLOR_PALETTE.slateLight),
  mint:       toDocxHex(COLOR_PALETTE.mint),
  awlBg:      toDocxHex(COLOR_PALETTE.awlBg),
  raddBg:     toDocxHex(COLOR_PALETTE.raddBg),
  treasuryBg: toDocxHex(COLOR_PALETTE.treasuryBg),
  mutedText:  toDocxHex(COLOR_PALETTE.mutedText),
} as const;

export async function exportToWord(
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

  // Lazy load docx
  const docx = await import('docx');
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    PageBreak, VerticalAlign, Footer, PageNumber,
  } = docx;

  type AlignmentVal = (typeof AlignmentType)[keyof typeof AlignmentType];

  const arText = (
    text: string,
    bold = false,
    size = 22,
    color?: string
  ): TextRun => new TextRun({
    text: text.toString(),
    rightToLeft: /[\u0600-\u06FF]/.test(text),
    font: { name: EXPORT_FONT_FAMILY, cs: EXPORT_FONT_FAMILY, ascii: EXPORT_FONT_FAMILY, hAnsi: EXPORT_FONT_FAMILY },
    bold,
    size,
    sizeComplexScript: size,
    color,
    language: { bidirectional: 'ar-DZ' },
  });

  const rtlPara = (
    text: string,
    bold = false,
    alignment: DocxAlignment = 'right',
    size = 22,
    spacingAfter = 120
  ): Paragraph => new Paragraph({
    bidirectional: true,
    alignment: alignment as AlignmentVal,
    children: [arText(text, bold, size)],
    spacing: { after: spacingAfter },
  });

  const COL = {
    heir   : 2100,   // الوارث
    role   : 3126,   // صفة الإرث
    share  : 1000,   // النصيب
    parts  :  800,   // السهام
    amount : 1200,   // المبلغ
    article:  800,   // المادة
  } as const;

  const COL_BLOCKED = {
    heir   : 2500,
    reason : 5726,
    article:  800,
  } as const;

  const COL_SUMMARY = [1805, 1805, 1806, 1805, 1805];

  const createCell = (
    text: string,
    isHeader = false,
    alignment: DocxAlignment = 'center',
    fill?: string,
    width?: number
  ): TableCell => new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        bidirectional: true,
        alignment: alignment as AlignmentVal,
        children: [arText(text, isHeader, isHeader ? 22 : 20)],
        spacing: { before: 60, after: 60 },
      }),
    ],
    shading: {
      fill: isHeader ? BRAND.green : (fill ?? BRAND.white),
    },
  });

  const addSectionLabel = (text: string): Paragraph =>
    new Paragraph({
      bidirectional: true,
      alignment: 'right' as AlignmentVal,
      children: [arText(text, true, 24, BRAND.white)],
      shading: { fill: BRAND.green },
      spacing: { before: 300, after: 160 },
    });

  function fmtShares(v: number): string {
    if (v <= 0) return '-';
    const s = v.toFixed(3).replace(/\.?0+$/, '');
    return s || '-';
  }

  const docChildren: FileChild[] = [];

  // --- Header ---
  docChildren.push(
    rtlPara("الجمهورية الجزائرية الديمقراطية الشعبية", true, 'right', 26, 80),
    rtlPara("وزارة العدل", false, 'right', 22, 80),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      children: [arText(`${office.officialDesignationAr} - ${office.notaryNameAr}`, true, 24, BRAND.green)],
      spacing: { after: 60 }
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      children: [arText(`${office.addressAr} - ${office.titleAr}`, false, 20, BRAND.mutedText)],
      spacing: { after: 120 }
    }),
    new Paragraph({
      border: {
        bottom: { color: BRAND.green, size: 6, space: 1, style: BorderStyle.SINGLE },
      },
      spacing: { after: 300 }
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [arText("وثيقة تصفية وتقسيم التركة الشرعية", true, 34)],
      shading: { fill: BRAND.mint },
      spacing: { before: 100, after: 100 }
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [arText("مستخرج من المنظومة التوثيقية الرقمية - وفق أحكام قانون الأسرة الجزائري (الأمر 84-11)", false, 20, BRAND.mutedText)],
      spacing: { after: 300 }
    })
  );

  const deceasedLabel = (g: 'male' | 'female' | null) => g === 'female' ? 'المرحومة' : 'المرحوم';
  const rootStage = allStagesResults[0];
  const rootDeceasedName = rootStage?.stage.deceasedName?.trim() || deceasedLabel(deceasedGender);

  // Legal Disclaimer Box
  docChildren.push(
    new Paragraph({
      bidirectional: true,
      alignment: 'right' as AlignmentVal,
      children: [arText(EXPORT_OFFICE_INFO.disclaimerTitleAr, true, 20, BRAND.red)],
      shading: { fill: BRAND.redLight },
      spacing: { before: 100, after: 80 }
    }),
    new Paragraph({
      bidirectional: true,
      alignment: 'right' as AlignmentVal,
      children: [arText(EXPORT_OFFICE_INFO.disclaimerTextAr, false, 18, '7f1d1d')],
      shading: { fill: BRAND.redLight },
      spacing: { after: 300 }
    }),
    rtlPara(`مسألة تركة ${deceasedLabel(deceasedGender)}: ${rootDeceasedName}`, true, 'center', 26),
    new Paragraph({ text: "", spacing: { after: 300 } })
  );

  const isPureMode = globalEstate === 0;

  if (isPureMode) {
    docChildren.push(
      rtlPara("نمط الحساب: تصفية فرضية نظرية لتحديد النسبة المئوية للحصص والسهام دون تحديد تركة مالية مسبقة.", false, 'right', 22),
      new Paragraph({ text: "", spacing: { after: 300 } })
    );
  } else {
    // --- Estate Summary Table ---
    docChildren.push(
      rtlPara("ملخص التركة والاستقطاعات الشرعية:", true, 'right', 24),
      new Paragraph({ text: "", spacing: { after: 100 } })
    );

    const summaryRows = [
      new TableRow({
        cantSplit: true,
        children: [
          createCell('إجمالي التركة', true, 'center', undefined, COL_SUMMARY[0]),
          createCell('الديون', true, 'center', undefined, COL_SUMMARY[1]),
          createCell('مصاريف الجنازة', true, 'center', undefined, COL_SUMMARY[2]),
          createCell('الوصايا', true, 'center', undefined, COL_SUMMARY[3]),
          createCell('صافي التركة للتوزيع', true, 'center', undefined, COL_SUMMARY[4]),
        ]
      }),
      new TableRow({
        cantSplit: true,
        children: [
          createCell(formatDocumentCurrency(globalEstate), false, 'center', BRAND.slateLight, COL_SUMMARY[0]),
          createCell(formatDocumentCurrency(globalDebts), false, 'center', BRAND.slateLight, COL_SUMMARY[1]),
          createCell(formatDocumentCurrency(globalFuneralCosts), false, 'center', BRAND.slateLight, COL_SUMMARY[2]),
          createCell(formatDocumentCurrency(globalBequest), false, 'center', BRAND.slateLight, COL_SUMMARY[3]),
          createCell(formatDocumentCurrency(rootStage?.netEstate ?? 0), false, 'center', BRAND.slateLight, COL_SUMMARY[4]),
        ]
      })
    ];

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        visuallyRightToLeft: true,
        rows: summaryRows,
      }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  }

  // --- Stages Iteration ---
  allStagesResults.forEach((stageResult, idx) => {
    const { stage, results, netEstate, noHeirsRedistribution } = stageResult;
    const isRoot = idx === 0;
    const defaultDeceasedName = isRoot
      ? rootDeceasedName
      : `المتوفى رقم ${idx}`;
    const deceasedName = stage.deceasedName?.trim() || defaultDeceasedName;
    const stageProblemBase = results[0]?.problemBase ?? null;

    if (!isRoot) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const titleText = isRoot
      ? `المرحلة الأولى: تقسيم تركة ${deceasedLabel(deceasedGender)} ${deceasedName}`
      : `المناسخة رقم ${idx}: تصفية حصة المتوفى ${deceasedName}`;

    docChildren.push(
      rtlPara(titleText, true, 'right', 26),
      new Paragraph({ text: "", spacing: { after: 100 } })
    );

    if (!isRoot) {
      docChildren.push(
        rtlPara(`صافي التركة المنتقلة للمتوفى: ${formatDocumentCurrency(netEstate)}`),
        new Paragraph({ text: "", spacing: { after: 50 } })
      );
    }

    docChildren.push(
      rtlPara(`أصل المسألة: ${stageProblemBase ?? '-'}`),
      new Paragraph({ text: "", spacing: { after: 100 } })
    );

    // Calc Notices (AWL / RADD)
    const calcType = results[0]?.calculationType;
    if (calcType === 'awl' || calcType === 'radd') {
      docChildren.push(
        new Paragraph({
          bidirectional: true,
          alignment: 'right' as AlignmentVal,
          shading: {
            fill: calcType === 'awl' ? BRAND.awlBg : BRAND.raddBg,
          },
          children: [arText(
            calcType === 'awl'
              ? 'تنبيه: مسألة عَوْل — وُسِّع أصل المسألة لاستيعاب جميع الفروض الشرعية (م.166)'
              : 'تنبيه: مسألة رَدّ — رُدَّ الفائض الشاغر على أصحاب الفروض الشرعية (م.167)',
            true, 20,
            calcType === 'awl' ? BRAND.amber : '1D4ED8'
          )],
          spacing: { before: 100, after: 100 },
        })
      );
    }

    // Bequests & Inheritors
    const bequests = results.filter(r => !r.isBlocked && (r.heirId === 'voluntary_bequest' || r.heirId === 'mandatory_bequest'));
    const inheritors = results.filter(r => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');

    const tableRows = [];

    // Header Row constructed from EXPORT_TABLE_COLUMNS
    tableRows.push(
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: EXPORT_TABLE_COLUMNS.map((col) => {
          const width = col.key === 'name' ? COL.heir :
                        col.key === 'role' ? COL.role :
                        col.key === 'share' ? COL.share :
                        col.key === 'parts' ? COL.parts :
                        col.key === 'amount' ? COL.amount : COL.article;
          const label = col.key === 'amount'
            ? (isPureMode ? col.labelPure : col.label)
            : col.label;
          return createCell(label, true, col.key === 'name' || col.key === 'role' ? 'right' : 'center', undefined, width);
        })
      })
    );

    // Bequests Rows
    bequests.forEach((b) => {
      const bPct = b.shareFraction.valueOf() * 100;
      const bPctStr = bPct > 0 ? (bPct % 1 === 0 ? `${bPct}%` : `${bPct.toFixed(2)}%`) : '0%';
      const valStr = isPureMode ? bPctStr : `${formatDocumentCurrency(b.amount)} (${bPctStr})`;

      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createCell(b.nameAr, false, 'right', BRAND.amberLight, COL.heir),
            createCell('وصية (تخرج قبل القسمة)', false, 'right', BRAND.amberLight, COL.role),
            createCell(b.share, false, 'center', BRAND.amberLight, COL.share),
            createCell('-', false, 'center', BRAND.amberLight, COL.parts),
            createCell(valStr, false, 'center', BRAND.amberLight, COL.amount),
            createCell(b.article ? `م ${b.article}` : 'م 184', false, 'center', BRAND.amberLight, COL.article),
          ]
        })
      );
    });

    // Inheritors Rows
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
        const indShare = indResult ? indResult.share : (r.count > 1 && r.shareFraction ? r.shareFraction.div(r.count).toFraction(true) : r.share);
        const indShares = indResult ? indResult.shares : (r.shares > 0 && stageProblemBase !== null ? (r.shares / r.count) : 0);

        const indShareFrac = indResult && indResult.shareFraction ? indResult.shareFraction : (r.shareFraction.compare(0) === 0 ? new Fraction(0) : r.shareFraction.div(r.count));
        const indPct = indShareFrac.valueOf() * 100;
        const indPctStr = indPct > 0 ? (indPct % 1 === 0 ? `${indPct}%` : `${indPct.toFixed(2)}%`) : '0%';
        const valStr = isPureMode ? indPctStr : `${formatDocumentCurrency(individualAmt)} (${indPctStr})`;

        const bgColor = rowIndex % 2 === 0 ? 'FFFFFF' : BRAND.mint;

        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createCell(displayName, false, 'right', bgColor, COL.heir),
              createCell(indResult ? indResult.reason : r.reason, false, 'right', bgColor, COL.role),
              createCell(indShare.toString(), false, 'center', bgColor, COL.share),
              createCell(fmtShares(indShares), false, 'center', bgColor, COL.parts),
              createCell(valStr, false, 'center', bgColor, COL.amount),
              createCell(r.article ? `م ${r.article}` : '', false, 'center', bgColor, COL.article),
            ]
          })
        );
        rowIndex++;
      }
    });

    // Total Row
    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createCell('المجموع الكلي', true, 'right', BRAND.green, COL.heir),
          createCell('', true, 'right', BRAND.green, COL.role),
          createCell('', true, 'center', BRAND.green, COL.share),
          createCell('', true, 'center', BRAND.green, COL.parts),
          createCell(isPureMode ? '100%' : `${formatDocumentCurrency(netEstate)} (100%)`, true, 'center', BRAND.green, COL.amount),
          createCell('', true, 'center', BRAND.green, COL.article),
        ]
      })
    );

    // Add table to doc
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        visuallyRightToLeft: true,
        rows: tableRows,
      }),
      new Paragraph({ text: "", spacing: { after: 300 } })
    );

    // No Heirs / Treasury Redistribution
    if (noHeirsRedistribution && noHeirsRedistribution.policy === 'treasury') {
      docChildren.push(
        addSectionLabel('الخزينة العمومية — المادة 180'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          visuallyRightToLeft: true,
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                createCell('الخزينة العمومية', false, 'right', BRAND.treasuryBg, COL_BLOCKED.heir),
                createCell(noHeirsRedistribution.messageAr, false, 'right', BRAND.treasuryBg, COL_BLOCKED.reason),
                createCell('م 180', false, 'center', BRAND.treasuryBg, COL_BLOCKED.article),
              ]
            })
          ],
        }),
        new Paragraph({ text: '', spacing: { after: 200 } })
      );
    }

    // Blocked heirs section
    const blockedRows = [];
    blockedRows.push(
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createCell('الوارث المحجوب', true, 'right', BRAND.red, COL_BLOCKED.heir),
          createCell('سبب الحجب', true, 'right', BRAND.red, COL_BLOCKED.reason),
          createCell('المادة', true, 'center', BRAND.red, COL_BLOCKED.article),
        ]
      })
    );

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

        blockedRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createCell(displayName, false, 'right', BRAND.redLight, COL_BLOCKED.heir),
              createCell(indResult ? indResult.reason : (bh.reason || 'محجوب من الميراث'), false, 'right', BRAND.redLight, COL_BLOCKED.reason),
              createCell(bh.article ? `م ${bh.article}` : '-', false, 'center', BRAND.redLight, COL_BLOCKED.article),
            ]
          })
        );
      }
    });

    if (blockedRows.length > 1) {
      docChildren.push(
        addSectionLabel('الورثة المحجوبون (حجب حرمان)'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          visuallyRightToLeft: true,
          rows: blockedRows,
        }),
        new Paragraph({ text: "", spacing: { after: 300 } })
      );
    }
  });

  // --- Signatures & Ending lines ---
  docChildren.push(
    new Paragraph({ text: '', spacing: { after: 600 } }),
    rtlPara('حُرِّر وفق قانون الأسرة الجزائري — الأمر 84-11 (المواد 126 – 183)', true, 'center', 22),
    rtlPara(
      `تاريخ التحرير: ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      false, 'right', 20
    )
  );

  const doc = new Document({
    creator: 'حاسبة الميراث الرقمية — الجزائر',
    title: `تركة ${rootDeceasedName}`,
    compatibility: {
      doNotExpandShiftReturn: true,
    },
    styles: {
      default: {
        document: {
          run: {
            font: { name: EXPORT_FONT_FAMILY, cs: EXPORT_FONT_FAMILY, ascii: EXPORT_FONT_FAMILY, hAnsi: EXPORT_FONT_FAMILY },
            size: 24,
            sizeComplexScript: 24,
            rightToLeft: true,
            language: { bidirectional: 'ar-DZ' }
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {},
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              bidirectional: true,
              alignment: 'center' as AlignmentVal,
              children: [
                arText(`العنوان: ${office.addressAr} | هاتف: ${office.phone} | صادر عبر منصة مواريث الرقمية (mawarith.dz)`, false, 18, BRAND.mutedText),
              ],
              spacing: { before: 80, after: 40 },
            }),
            new Paragraph({
              bidirectional: true,
              alignment: 'center' as AlignmentVal,
              children: [
                arText(`الأستاذ الموثق ${office.notaryNameAr} | صفحة `, false, 18, BRAND.mutedText),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: { name: EXPORT_FONT_FAMILY, cs: EXPORT_FONT_FAMILY },
                  size: 18,
                  color: BRAND.mutedText,
                }),
                arText(' من ', false, 18, BRAND.mutedText),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: { name: EXPORT_FONT_FAMILY, cs: EXPORT_FONT_FAMILY },
                  size: 18,
                  color: BRAND.mutedText,
                }),
              ],
            }),
          ],
        }),
      },
      children: docChildren,
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = EXPORT_FILENAME(rootDeceasedName, 'docx', office.notaryNameAr);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
