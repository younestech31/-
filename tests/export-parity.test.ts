/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Intercept jsPDF calls globally
(global as any).__pdfTexts = [];

vi.mock('jspdf', async (importOriginal) => {
  const original = await importOriginal<typeof import('jspdf')>();
  class MockedjsPDF extends original.jsPDF {
    constructor(options?: any) {
      super(options);
      const originalText = this.text;
      this.text = function (text: any, x: any, y: any, opts: any) {
        if (typeof text === 'string') {
          (global as any).__pdfTexts.push(text);
        } else if (Array.isArray(text)) {
          (global as any).__pdfTexts.push(...text);
        }
        return originalText.call(this, text, x, y, opts);
      };
      this.save = (() => this) as unknown as typeof this.save;
    }
  }
  return {
    ...original,
    jsPDF: MockedjsPDF,
  };
});

// Intercept docx constructors globally and expose raw options
let capturedTableOptions: any = null;

vi.mock('docx', async (importOriginal) => {
  const original = await importOriginal<typeof import('docx')>();
  class MockedDocument extends original.Document {
    constructor(options: any) {
      super(options);
    }
  }
  class MockedTable extends original.Table {
    options: any;
    constructor(options: any) {
      super(options);
      this.options = options;
      capturedTableOptions = options;
    }
  }
  class MockedTableRow extends original.TableRow {
    constructor(options: any) {
      // The base TableRow owns a private options field, initialized in super().
      super(options);
    }
  }
  class MockedTableCell extends original.TableCell {
    options: any;
    constructor(options: any) {
      super(options);
      this.options = options;
    }
  }
  class MockedParagraph extends original.Paragraph {
    options: any;
    constructor(options: any) {
      super(options);
      this.options = options;
    }
  }
  class MockedTextRun extends original.TextRun {
    options: any;
    constructor(options: any) {
      super(options);
      this.options = options;
    }
  }
  return {
    ...original,
    Document: MockedDocument,
    Table: MockedTable,
    TableRow: MockedTableRow,
    TableCell: MockedTableCell,
    Paragraph: MockedParagraph,
    TextRun: MockedTextRun,
  };
});

import { calculateInheritance } from '../lib/inheritance/inheritance-calculator';
import { exportToPDF, fixArabicRtl } from '../lib/inheritance/pdf-export';
import { exportToWord } from '../lib/inheritance/word-export';
import { exportToExcel } from '../lib/inheritance/excel-export';
import { formatDocumentCurrency } from '../lib/inheritance/document-branding';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import ExcelJS from 'exceljs';

// Helper to extract text from raw docx nodes (TableCell, Paragraph, TextRun, etc.)
function getDocxNodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  // TextRun text option
  if (node.options && typeof node.options.text === 'string') {
    return node.options.text;
  }

  // Paragraph/Cell children list in options
  if (node.options && Array.isArray(node.options.children)) {
    return node.options.children.map(getDocxNodeText).join('');
  }

  // Instance level direct children
  if (Array.isArray(node.children)) {
    return node.children.map(getDocxNodeText).join('');
  }

  return '';
}

// Strip Unicode isolates and trim
function cleanString(str: string): string {
  return str.replace(/[\u2066\u2069\u2067\u2068]/g, '').trim();
}

describe('Cross-Format Export Parity Tests', () => {
  let capturedExcelBuffer: Buffer | null = null;

  beforeAll(() => {
    // Spies/Mocks for ExcelJS
    const originalWorkbook = ExcelJS.Workbook;
    ExcelJS.Workbook = class extends originalWorkbook {
      constructor() {
        super();
        const originalWrite = this.xlsx.writeBuffer;
        this.xlsx.writeBuffer = async () => {
          const buffer = await originalWrite.call(this.xlsx);
          capturedExcelBuffer = Buffer.from(buffer);
          return buffer;
        };
      }
    } as any;

    // Mock document
    if (typeof document === 'undefined') {
      (global as any).document = {
        createElement: () => ({
          click: () => {},
          setAttribute: () => {},
          style: {},
        }),
        body: {
          appendChild: () => {},
          removeChild: () => {},
        },
      };
    }

    // Attach mock URL create/revoke methods directly to global URL class
    (global as any).URL.createObjectURL = () => 'blob:mock';
    (global as any).URL.revokeObjectURL = () => {};
  });

  it('asserts that Word, Excel, and PDF exporters produce numerically and textually identical heir data', async () => {
    // 1. Run a representative multi-heir, aul-triggering case (Minbariyya case)
    // Estate: 270,000 -> Base 24 -> Awl to 27
    // Wife 1 (3/27 = 30k), Daughter 1 (8/27 = 80k), Daughter 2 (8/27 = 80k), Father (4/27 = 40k), Mother (4/27 = 40k)
    const heirs = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'daughter', count: 2, isPresent: true },
      { heirId: 'father', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(heirs, 270000, 0, 0, 0, false, []);
    expect(results[0].problemBase).toBe(27);
    expect(results[0].calculationType).toBe('awl');

    const allStagesResults: StageResult[] = [
      {
        stage: {
          id: 'stage-root',
          deceasedName: 'الفقيد أحمد',
          estate: 270000,
          debts: 0,
          funeralCosts: 0,
          bequest: 0,
          hasMandatoryBequest: false,
          heirPresence: {
            wife: { heirId: 'wife', count: 1, isPresent: true },
            daughter: { heirId: 'daughter', count: 2, isPresent: true },
            father: { heirId: 'father', count: 1, isPresent: true },
            mother: { heirId: 'mother', count: 1, isPresent: true },
          },
        },
        results: results,
        netEstate: 270000,
        noHeirsRedistribution: null,
      },
    ];

    const params = {
      estate: 270000,
      debts: 0,
      funeralCosts: 0,
      bequest: 0,
      deceasedGender: 'male' as const,
    };

    // 2. Trigger all three exporters to populate our spies/mocks
    capturedTableOptions = null;
    capturedExcelBuffer = null;
    (global as any).__pdfTexts.length = 0;

    await exportToWord(allStagesResults, params);
    await exportToExcel(allStagesResults, params);
    await exportToPDF(allStagesResults, params);

    expect(capturedExcelBuffer).not.toBeNull();
    expect((global as any).__pdfTexts.length).toBeGreaterThan(0);

    // ─── A. PARSE EXCEL DATA ───
    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(capturedExcelBuffer! as unknown as Parameters<typeof readWorkbook.xlsx.load>[0]);
    const ws = readWorkbook.getWorksheet('م.الأصلية — الورثة');
    expect(ws).toBeDefined();

    // Excel column layout:
    // A: الوارث (Name), B: صفة الإرث (Reason), C: النصيب (Share), D: السهام (Parts), E: النسبة (Percentage), F: المبلغ (Amount), G: المادة (Article)
    const excelHeirs: any[] = [];
    ws!.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip headers
        const name = row.getCell(1).value?.toString();
        const reason = row.getCell(2).value?.toString();
        const share = row.getCell(3).value?.toString();
        const parts = row.getCell(4).value?.toString();
        const percentage = row.getCell(5).value?.toString();
        const amount = row.getCell(6).value; // numeric amount
        const article = row.getCell(7).value?.toString();

        // Skip notices row (e.g. "عول...") and total row
        if (name && !name.startsWith('عول') && name !== 'المجموع الكلي' && name !== 'المجموع الكلي للحصص والسهام المصححة للمسألة') {
          excelHeirs.push({ name, reason, share, parts, percentage, amount, article });
        }
      }
    });

    // ─── B. PARSE WORD DATA ───
    expect(capturedTableOptions).not.toBeNull();
    const wordHeirs: any[] = [];
    const wordRows = capturedTableOptions.rows;
    expect(wordRows).toBeDefined();

    wordRows.forEach((row: any, rowIdx: number) => {
      if (rowIdx > 0) { // Skip header row
        const cells = row.options.children;
        const name = getDocxNodeText(cells[0]);
        const reason = getDocxNodeText(cells[1]);
        const share = getDocxNodeText(cells[2]);
        const parts = getDocxNodeText(cells[3]);
        const percentage = getDocxNodeText(cells[4]);
        const amountStr = getDocxNodeText(cells[5]);
        const article = getDocxNodeText(cells[6]);

        const isTotal = name.includes('المجموع الكلي');
        if (name && !isTotal) {
          wordHeirs.push({ name, reason, share, parts, percentage, amountStr, article });
        }
      }
    });

    console.log('DEBUG excelHeirs names:', excelHeirs.map(h => h.name));
    console.log('DEBUG wordHeirs names:', wordHeirs.map(h => h.name));

    // ─── C. ASSERT IDENTITY BETWEEN EXCEL AND WORD ───
    expect(excelHeirs.length).toBe(5);
    expect(wordHeirs.length).toBe(5);

    for (let i = 0; i < 5; i++) {
      const ex = excelHeirs[i];
      const wd = wordHeirs[i];

      // Assert names are identical directly (both Word and Excel use raw Arabic)
      expect(cleanString(wd.name)).toBe(cleanString(ex.name));

      // Assert reasons are identical directly
      expect(cleanString(wd.reason)).toBe(cleanString(ex.reason));

      // Assert share fractions are identical
      expect(cleanString(wd.share)).toBe(cleanString(ex.share));

      // Assert share percentage strings are identical (e.g. '11.11%', '29.63%', etc.)
      expect(cleanString(wd.percentage)).toBe(cleanString(ex.percentage));

      // Assert amounts correspond (Excel holds numeric value, Word holds formatted currency string)
      const expectedCurrencyStr = formatDocumentCurrency(ex.amount);
      expect(cleanString(wd.amountStr)).toBe(cleanString(expectedCurrencyStr));
    }

    // ─── D. ASSERT PARITY WITH PDF TEXT CALLS ───
    // For each of the heirs, ensure their fractional shares, percentage strings, and amount strings are represented perfectly in the PDF text calls.
    for (let i = 0; i < 5; i++) {
      const ex = excelHeirs[i];

      // Check for name/text in PDF text calls (allowing wrapping)
      const nameParts = cleanString(ex.name).split(/\s+/);
      const nameExists = nameParts.every((part) => {
        const cleanPart = cleanString(part);
        const cleanReshapedPart = cleanString(fixArabicRtl(part));
        return (global as any).__pdfTexts.some((t: string) => {
          const cleanT = cleanString(t);
          return cleanT.includes(cleanPart) || cleanT.includes(cleanReshapedPart);
        });
      });
      expect(nameExists).toBe(true);

      // Check for share fraction in PDF text calls (allowing wrapping)
      const shareParts = cleanString(ex.share).split(/\s+/);
      const shareExists = shareParts.every((part) => {
        const cleanPart = cleanString(part);
        const cleanReshapedPart = cleanString(fixArabicRtl(part));
        return (global as any).__pdfTexts.some((t: string) => {
          const cleanT = cleanString(t);
          return cleanT.includes(cleanPart) || cleanT.includes(cleanReshapedPart);
        });
      });
      expect(shareExists).toBe(true);

      // Check for percentage string in PDF text calls (allowing wrapping)
      const pctParts = cleanString(ex.percentage).split(/\s+/);
      const pctExists = pctParts.every((part) => {
        const cleanPart = cleanString(part);
        const cleanReshapedPart = cleanString(fixArabicRtl(part));
        return (global as any).__pdfTexts.some((t: string) => {
          const cleanT = cleanString(t);
          return cleanT.includes(cleanPart) || cleanT.includes(cleanReshapedPart);
        });
      });
      expect(pctExists).toBe(true);

      // Check for currency formatted amount in PDF text calls (allowing wrapping)
      const formattedAmt = formatDocumentCurrency(ex.amount);
      const amtParts = cleanString(formattedAmt).split(/\s+/);
      const amtExists = amtParts.every((part) => {
        const cleanPart = cleanString(part);
        const cleanReshapedPart = cleanString(fixArabicRtl(part));
        return (global as any).__pdfTexts.some((t: string) => {
          const cleanT = cleanString(t);
          return cleanT.includes(cleanPart) || cleanT.includes(cleanReshapedPart);
        });
      });
      expect(amtExists).toBe(true);
    }
  });
});
