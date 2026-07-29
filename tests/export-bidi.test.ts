import { describe, it, expect } from 'vitest';
import { fixArabicRtl } from '@/lib/inheritance/pdf-export';
import { exportToWord } from '@/lib/inheritance/word-export';
import { exportToExcel } from '@/lib/inheritance/excel-export';
import type { StageResult } from '@/components/inheritance/ResultsTable';

describe('Bidi and Latin-script custom heir names in exports', () => {
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

  it('exporters execute successfully with Latin customNames ("Sarah Belkacem")', async () => {
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

    await expect(
      exportToWord(mockStageResult, { estate: 1000000, debts: 0, funeralCosts: 0, bequest: 0, deceasedGender: 'male' })
    ).resolves.toBeUndefined();

    await expect(
      exportToExcel(mockStageResult, { estate: 1000000, debts: 0, funeralCosts: 0, bequest: 0, deceasedGender: 'male' })
    ).resolves.toBeUndefined();
  });
});
