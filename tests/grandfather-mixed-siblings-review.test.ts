import { describe, expect, it } from 'vitest';
import { validateMunasakhatStageExclusions } from '@/data/munasakhat-exclusions';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { HeirPresence } from '@/lib/inheritance/inheritance-calculator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

const present = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

function makeStage(heirs: HeirPresence[]): MunasakhatStage {
  return {
    id: 'art158-grandfather-review',
    deceasedName: 'اختبار اجتماع الجد مع الإخوة',
    parentHeirId: '',
    parentStageId: '',
    hasMandatoryBequest: false,
    confirmedSpouseEligibility: true,
    heirs,
  };
}

function runSingleStage(heirs: HeirPresence[]) {
  const stage = makeStage(heirs);
  const [result] = runInheritanceOrchestration([[stage], 900_000, 0, 0, 0]);
  expect(result).toBeDefined();
  return { stage, result };
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

  it.each(mixedCases)('$id — withholds the distribution and exposes the legal-review reason', testCase => {
    const { stage, result } = runSingleStage(testCase.heirs);
    const validation = validateMunasakhatStageExclusions(stage, null, 0);

    expect(validation.requiresManualClassification).toBe(true);
    expect(validation.manualClassificationReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining('المادة 158'),
        expect.stringContaining('المعادّة'),
      ]),
    );

    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toEqual([]);
  });
});

describe('Article 158 — review guard is limited to mixed sibling lines', () => {
  it('continues to calculate when the grandfather meets full siblings only', () => {
    const heirs = [
      present('grandfather'),
      present('full_brother', 2),
    ];
    const { stage, result } = runSingleStage(heirs);
    const validation = validateMunasakhatStageExclusions(stage, null, 0);

    expect(validation.requiresManualClassification).toBe(false);
    expect(result.requiresManualClassification).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('continues to calculate when the grandfather meets paternal siblings only', () => {
    const heirs = [
      present('grandfather'),
      present('paternal_sister'),
    ];
    const { stage, result } = runSingleStage(heirs);
    const validation = validateMunasakhatStageExclusions(stage, null, 0);

    expect(validation.requiresManualClassification).toBe(false);
    expect(result.requiresManualClassification).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
  });
});
