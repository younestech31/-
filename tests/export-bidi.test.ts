import { describe, it, expect } from 'vitest';
import { fixArabicRtl } from '@/lib/inheritance/pdf-export';
import { exportToWord } from '@/lib/inheritance/word-export';
import { exportToExcel } from '@/lib/inheritance/excel-export';
import { toArabicIndicDigits, formatDocumentCurrency, getNotarialAttestationData, DEFAULT_OFFICE_SETTINGS } from '@/lib/inheritance/document-branding';
import { translateHeirName, translateArticle } from '@/lib/inheritance/export-translations';
import type { StageResult } from '@/components/inheritance/ResultsTable';

describe('Bidi, French-locale, Digits & Notarial Attestation Export Tests', () => {
  it('fixArabicRtl wraps pure Latin text in First Strong Isolate unicode characters (\u2066...\u2069)', () => {
    const res = fixArabicRtl('Sarah Belkacem');
    expect(res).toContain('\u2066');
    expect(res).toContain('\u2069');
    expect(res).toContain('Sarah Belkacem');
  });

  it('fixArabicRtl reshapes pure Arabic text normally', () => {
    const res = fixArabicRtl('محمد');
    expect(res).not.toBe('محمد');
  });

  it('(a) fixArabicRtl preserves embedded Latin custom names inside Arabic text in LTR run order', () => {
    const input = 'الوريث Sarah Belkacem له نصيب';
    const res = fixArabicRtl(input);
    expect(res).toContain('Sarah Belkacem');
    // Ensure Latin name characters maintain visual LTR relative order (S before a, B before e)
    expect(res.indexOf('S')).toBeLessThan(res.indexOf('a'));
    expect(res.indexOf('B')).toBeLessThan(res.indexOf('e'));
  });

  it('(b) fixArabicRtl handles French-mode text with embedded Arabic legal citations correctly', () => {
    const input = 'Époux (Az-Zawj) - المادة 144';
    const res = fixArabicRtl(input);
    expect(res).toContain('Époux');
    expect(res).toContain('Az-Zawj');
    // Ensures Arabic part is reshaped into visual glyphs
    expect(res).not.toContain('المادة');
  });

  it('(c) fixArabicRtl formats Arabic currency with embedded Western digits correctly and calculates non-zero width', async () => {
    const input = 'المبلغ 50.000,00 دج صافي';
    const res = fixArabicRtl(input);
    expect(res).toContain('50.000,00');

    // Render in jsPDF instance to measure text width & confirm rendering validity
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const width = pdf.getTextWidth(res);
    expect(width).toBeGreaterThan(0);
  });

  it('converts Western digits to Arabic-Indic digits correctly', () => {
    expect(toArabicIndicDigits('1234567890')).toBe('١٢٣٤٥٦٧٨٩٠');
    expect(toArabicIndicDigits('DZD 50.000,00')).toBe('DZD ٥٠.٠٠٠,٠٠');
  });

  it('formats document currency with digit and language options', () => {
    const arWestern = formatDocumentCurrency(1000000, true, 'western', 'ar');
    expect(arWestern).toContain('1.000.000,00 دج');

    const arIndic = formatDocumentCurrency(1000000, true, 'arabic-indic', 'ar');
    expect(arIndic).toContain('١.٠٠٠.٠٠٠,٠٠');

    const frWestern = formatDocumentCurrency(1000000, true, 'western', 'fr');
    expect(frWestern).toContain('1.000.000,00 DZD');
  });

  it('translates heir names and legal articles correctly for French exports', () => {
    expect(translateHeirName('husband', 'زوج', 'fr')).toBe('Époux (Az-Zawj)');
    expect(translateHeirName('son', 'ابن', 'fr')).toBe('Fils (Al-Ibn)');
    expect(translateArticle('المادة 144', 'fr')).toBe('Art. 144 Code de la Famille');
  });

  it('generates Notarial Attestation Block data for Arabic and French', () => {
    const verifiedSettings = { ...DEFAULT_OFFICE_SETTINGS, notaryLicenseVerified: true };
    const dataAr = getNotarialAttestationData(verifiedSettings, null, 'ar');
    expect(dataAr.title).toContain('غير مصادق عليه');
    expect(dataAr.attestationText).toContain('لا يُعدّ عقداً رسمياً');
    expect(dataAr.attestationText).not.toContain('أشهد أنا الموثق');

    const dataFr = getNotarialAttestationData(verifiedSettings, null, 'fr');
    expect(dataFr.title).toContain('RAPPORT DE CALCUL');
    expect(dataFr.attestationText).toContain('ne constitue pas un acte authentique');
  });

  it('exporters execute successfully with French language and Latin customNames', async () => {
    const mockStageResult: StageResult[] = [
      {
        stage: {
          id: 'stage-1',
          deceasedName: 'الفقيد أحمد',
          estate: 1000000,
          debts: 0,
          funeralCosts: 0,
          bequest: 0,
          hasMandatoryBequest: false,
          heirPresence: {
            son: {
              heirId: 'son',
              isPresent: true,
              count: 1,
              customNames: ['Sarah Belkacem'],
            },
          },
        },
        results: [
          {
            heirId: 'son',
            nameAr: 'ابن',
            share: '1/1',
            shares: 1,
            shareFraction: new (await import('fraction.js')).default(1),
            shareDecimal: 1,
            amount: 1000000,
            isBlocked: false,
            reason: 'تعصيباً',
            count: 1,
            problemBase: 1,
            calculationType: 'normal',
          },
        ],
        netEstate: 1000000,
        noHeirsRedistribution: null,
      },
    ];

    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = () => 'blob:mock';
      window.URL.revokeObjectURL = () => {};
    }

    if (typeof document === 'undefined') {
      (global as unknown as Record<string, unknown>).document = {
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

    const frSettings = {
      ...DEFAULT_OFFICE_SETTINGS,
      exportLanguage: 'fr' as const,
      digitFormat: 'western' as const,
    };

    await expect(
      exportToWord(mockStageResult, { estate: 1000000, debts: 0, funeralCosts: 0, bequest: 0, deceasedGender: 'male' }, frSettings)
    ).resolves.toBeUndefined();

    await expect(
      exportToExcel(mockStageResult, { estate: 1000000, debts: 0, funeralCosts: 0, bequest: 0, deceasedGender: 'male' }, frSettings)
    ).resolves.toBeUndefined();
  });
});
