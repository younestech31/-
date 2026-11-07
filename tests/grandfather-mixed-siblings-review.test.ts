import { describe, expect, it } from 'vitest';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { HeirPresence } from '@/lib/inheritance/inheritance-calculator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

const present = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

function runSingleStage(heirs: HeirPresence[]) {
  const stage: MunasakhatStage = {
    id: 'art158-grandfather-review',
    deceasedName: 'اختبار اجتماع الجد مع الإخوة',
    parentHeirId: '',
    parentStageId: '',
    hasMandatoryBequest: false,
    confirmedSpouseEligibility: true,
    heirs,
  };

  const [result] = runInheritanceOrchestration([[stage], 900_000, 0, 0, 0]);
  expect(result).toBeDefined();
  return result;
}

describe('Article 158 — mixed full and paternal siblings with the grandfather', () => {
  const mixedCases: Array<{ id: string; heirs: HeirPresence[] }> = [
    {
      id: 'grandfather-full-brother-and-paternal-brother',
      heirs: [
        present('grandfather'),
        present('full_brother'),
        present('paternal_brother'),
      ],
    },
    {
      id: 'grandfather-one-full-sister-with-paternal-siblings',
      heirs: [
        present('grandfather'),
        present('full_sister'),
        present('paternal_brother'),
        present('paternal_sister'),
      ],
    },
    {
      id: 'wife-grandfather-two-full-sisters-and-paternal-brother',
      heirs: [
        present('wife'),
        present('grandfather'),
        present('full_sister', 2),
        present('paternal_brother'),
      ],
    },
    {
      id: 'husband-mother-grandfather-full-brother-and-paternal-sister',
      heirs: [
        present('husband'),
        present('mother'),
        present('grandfather'),
        present('full_brother'),
        present('paternal_sister'),
      ],
    },
  ];

  it.each(mixedCases)('$id — holds the distribution and explains mu\u2019adadah', testCase => {
    const result = runSingleStage(testCase.heirs);

    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toEqual([]);

    const warning = result.excludedHeirWarnings?.find(
      item => item.heirId === 'grandfather_mixed_siblings',
    );
    expect(warning).toBeDefined();
    expect(warning?.heirNameAr).toContain('الجد');
    expect(warning?.reason).toContain('المعادّة');
    expect(warning?.reason).toContain('المادة 158');
    expect(warning?.source).toContain('شرح الزرقاني');
  });
});

describe('Article 158 — review guard is limited to mixed sibling lines', () => {
  it('continues to calculate when the grandfather meets full siblings only', () => {
    const result = runSingleStage([
      present('grandfather'),
      present('full_brother', 2),
    ]);

    expect(result.requiresManualClassification).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.excludedHeirWarnings?.some(
      item => item.heirId === 'grandfather_mixed_siblings',
    )).toBe(false);
  });

  it('continues to calculate when the grandfather meets paternal siblings only', () => {
    const result = runSingleStage([
      present('grandfather'),
      present('paternal_sister'),
    ]);

    expect(result.requiresManualClassification).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.excludedHeirWarnings?.some(
      item => item.heirId === 'grandfather_mixed_siblings',
    )).toBe(false);
  });
});
