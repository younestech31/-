import { describe, expect, it } from 'vitest';
import { calculateInheritance, type HeirPresence } from '@/lib/inheritance/inheritance-calculator';
import { buildResultsClipboardText } from '@/lib/inheritance/results-clipboard';

describe('Results clipboard uses real per-person inheritance allocations', () => {
  it('does not divide an inheriting group share across an impeded individual', () => {
    const heirs: HeirPresence[] = [
      {
        heirId: 'wife',
        count: 2,
        isPresent: true,
        impededIndexes: [true, false],
        impedimentReasonIds: ['intentional_killer', undefined],
      },
      { heirId: 'son', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(heirs, 800_000, 0, 0, 0);
    const wives = results.find(result => result.heirId === 'wife');

    expect(wives).toBeDefined();
    expect(wives?.amount).toBe(100_000);
    expect(wives?.individuals?.map(person => person.amount)).toEqual([0, 100_000]);
    expect(wives?.individuals?.map(person => person.isBlocked)).toEqual([true, false]);

    const copied = buildResultsClipboardText({
      title: 'نتائج الاختبار',
      results: [wives!],
      isPureSharesMode: false,
    });

    expect(copied).toContain('الزوجة / الزوجات 1: محروم - المبلغ: 0 دج (0%)');
    expect(copied).toContain('الزوجة / الزوجات 2: 1/8 - المبلغ: 100.000 دج (12.50%)');
    expect(copied).not.toContain('50.000 دج');
  });

  it('uses custom names and preserves blocked status in pure-share summaries', () => {
    const heirs: HeirPresence[] = [
      {
        heirId: 'wife',
        count: 2,
        isPresent: true,
        impededIndexes: [true, false],
        impedimentReasonIds: ['intentional_killer', undefined],
      },
      { heirId: 'son', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 800_000, 0, 0, 0);
    const wives = results.find(result => result.heirId === 'wife')!;

    const copied = buildResultsClipboardText({
      title: 'ملخص الحصص',
      results: [wives],
      customNamesByHeir: { wife: ['الزوجة الأولى', 'الزوجة الثانية'] },
      isPureSharesMode: true,
    });

    expect(copied.split('\n')).toEqual([
      'ملخص الحصص',
      '--------------------------------------------------',
      'الزوجة الأولى (الزوجة / الزوجات): محروم - النسبة: 0%',
      'الزوجة الثانية (الزوجة / الزوجات): 1/8 - النسبة: 12.50%',
    ]);
    expect(copied).not.toContain('دج');
  });
});
