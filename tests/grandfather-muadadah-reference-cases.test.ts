import { describe, expect, it } from 'vitest';
import {
  calculateInheritance,
  type CalculationResult,
  type HeirPresence,
} from '@/lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

const present = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

type Expected = {
  fraction: string;
  amount: number;
  blocked?: boolean;
  individualAmounts?: number[];
};

type ReferenceCase = {
  id: string;
  basis: string;
  estate: number;
  heirs: HeirPresence[];
  expected: Record<string, Expected>;
};

/**
 * Independent Article 158 / Zayd-method reference fixtures.
 *
 * These expected fractions are transcribed from the worked examples and
 * rules in the University of Blida 2 inheritance lectures (2021/2022),
 * cross-checked against al-Zurqani's commentary on the Muwatta, Book of
 * Inheritance, "Grandfather's inheritance" chapter. The expected values are
 * deliberately literal and are not generated from calculator rule tables.
 *
 * calculateInheritance is exercised here as a low-level arithmetic path only.
 * The production orchestration must continue to hold mixed sibling lines for
 * legal review until the input model and the statutory interpretation have
 * been professionally signed off.
 */
const referenceCases: ReferenceCase[] = [
  {
    id: 'art158-mixed-no-muadadah-two-full-brothers-and-one-paternal-brother',
    basis: 'Blida 2 lectures: two full brothers already make the one-third option optimal; the paternal brother is excluded by the full brothers',
    estate: 300_000,
    heirs: [
      present('grandfather'),
      present('full_brother', 2),
      present('paternal_brother'),
    ],
    expected: {
      grandfather: { fraction: '1/3', amount: 100_000 },
      full_brother: { fraction: '2/3', amount: 200_000, individualAmounts: [100_000, 100_000] },
      paternal_brother: { fraction: '0', amount: 0, blocked: true },
    },
  },
  {
    id: 'art158-muadadah-wife-grandfather-full-brother-paternal-brother',
    basis: 'Blida 2 worked case: wife 1/4; grandfather 1/3 of the 3/4 residue (equal here to muqasama); full brother takes the remaining 1/2',
    estate: 400_000,
    heirs: [
      present('wife'),
      present('grandfather'),
      present('full_brother'),
      present('paternal_brother'),
    ],
    expected: {
      wife: { fraction: '1/4', amount: 100_000 },
      grandfather: { fraction: '1/4', amount: 100_000 },
      full_brother: { fraction: '1/2', amount: 200_000 },
      paternal_brother: { fraction: '0', amount: 0, blocked: true },
    },
  },
  {
    id: 'art158-zayd-tenariya-grandfather-full-sister-paternal-brother',
    basis: 'Zaydiyya tenariya: muqasama before the full sister completes her half; final original shares are 2/5, 1/2, 1/10',
    estate: 300_000,
    heirs: [
      present('grandfather'),
      present('full_sister'),
      present('paternal_brother'),
    ],
    expected: {
      grandfather: { fraction: '2/5', amount: 120_000 },
      full_sister: { fraction: '1/2', amount: 150_000 },
      paternal_brother: { fraction: '1/10', amount: 30_000 },
    },
  },
  {
    id: 'art158-muadadah-one-full-sister-three-paternal-sisters',
    basis: 'Blida 2 / Zayd method: grandfather receives 1/3; full sister completes 1/2 from the paternal sisters; their remaining pool is 1/6',
    estate: 180_000,
    heirs: [
      present('grandfather'),
      present('full_sister'),
      present('paternal_sister', 3),
    ],
    expected: {
      grandfather: { fraction: '1/3', amount: 60_000 },
      full_sister: { fraction: '1/2', amount: 90_000 },
      paternal_sister: {
        fraction: '1/6',
        amount: 30_000,
        individualAmounts: [10_000, 10_000, 10_000],
      },
    },
  },
  {
    id: 'art158-mukhtasarat-zayd-mother-grandfather-full-sister-paternal-brother-and-sister',
    basis: 'University of Chlef worked "Mukhtasarat Zayd" case: mother 1/6, grandfather 5/18, full sister 1/2, and the remaining 1/18 divided 2:1 between paternal brother and paternal sister',
    estate: 540_000,
    heirs: [
      present('mother'),
      present('grandfather'),
      present('full_sister'),
      present('paternal_brother'),
      present('paternal_sister'),
    ],
    expected: {
      mother: { fraction: '1/6', amount: 90_000 },
      grandfather: { fraction: '5/18', amount: 150_000 },
      full_sister: { fraction: '1/2', amount: 270_000 },
      paternal_brother: { fraction: '1/27', amount: 20_000 },
      paternal_sister: { fraction: '1/54', amount: 10_000 },
    },
  },
  {
    id: 'art158-grandfather-one-full-brother-muqasama-half',
    basis: 'Article 158 / Zayd method: one brother gives the grandfather one half by muqasama, better than one third of the whole',
    estate: 100_000,
    heirs: [present('grandfather'), present('full_brother')],
    expected: {
      grandfather: { fraction: '1/2', amount: 50_000 },
      full_brother: { fraction: '1/2', amount: 50_000 },
    },
  },
  {
    id: 'art158-grandfather-one-full-sister-muqasama-two-thirds',
    basis: 'Article 158 / Zayd method: the grandfather counts as two shares against one sister, so he takes two thirds by muqasama',
    estate: 90_000,
    heirs: [present('grandfather'), present('full_sister')],
    expected: {
      grandfather: { fraction: '2/3', amount: 60_000 },
      full_sister: { fraction: '1/3', amount: 30_000 },
    },
  },
  {
    id: 'art158-grandfather-two-full-sisters-muqasama-equals-third',
    basis: 'Article 158 / Zayd method: grandfather two shares against two sisters; muqasama and one third are equal',
    estate: 180_000,
    heirs: [present('grandfather'), present('full_sister', 2)],
    expected: {
      grandfather: { fraction: '1/2', amount: 90_000 },
      full_sister: { fraction: '1/2', amount: 90_000, individualAmounts: [45_000, 45_000] },
    },
  },
  {
    id: 'art158-grandfather-three-full-sisters-muqasama-two-fifths',
    basis: 'Article 158 / Zayd method: grandfather two shares against three sisters five total parts; muqasama gives him two fifths',
    estate: 150_000,
    heirs: [present('grandfather'), present('full_sister', 3)],
    expected: {
      grandfather: { fraction: '2/5', amount: 60_000 },
      full_sister: { fraction: '3/5', amount: 90_000, individualAmounts: [30_000, 30_000, 30_000] },
    },
  },
  {
    id: 'art158-grandfather-two-full-brothers-equal-third-and-muqasama',
    basis: 'Article 158 boundary: two full brothers make the grandfather third by muqasama, equal to one third of the whole estate',
    estate: 120_000,
    heirs: [present('grandfather'), present('full_brother', 2)],
    expected: {
      grandfather: { fraction: '1/3', amount: 40_000 },
      full_brother: { fraction: '2/3', amount: 80_000, individualAmounts: [40_000, 40_000] },
    },
  },
  {
    id: 'art158-grandfather-four-full-sisters-equal-third-and-muqasama',
    basis: 'Article 158 boundary: four sisters equal four sibling parts; grandfather two of six parts, exactly one third',
    estate: 120_000,
    heirs: [present('grandfather'), present('full_sister', 4)],
    expected: {
      grandfather: { fraction: '1/3', amount: 40_000 },
      full_sister: { fraction: '2/3', amount: 80_000, individualAmounts: [20_000, 20_000, 20_000, 20_000] },
    },
  },
  {
    id: 'art158-grandfather-five-full-sisters-third-better-than-muqasama',
    basis: 'Article 158 boundary: five sisters make muqasama less than one third, so the statutory one-third option is better for the grandfather',
    estate: 210_000,
    heirs: [present('grandfather'), present('full_sister', 5)],
    expected: {
      grandfather: { fraction: '1/3', amount: 70_000 },
      full_sister: { fraction: '2/3', amount: 140_000, individualAmounts: [28_000, 28_000, 28_000, 28_000, 28_000] },
    },
  },
  {
    id: 'art158-grandfather-one-full-brother-two-full-sisters-equal-third-boundary',
    basis: 'Article 158 boundary: one brother and two sisters equal four sibling parts; grandfather receives one third by muqasama',
    estate: 150_000,
    heirs: [present('grandfather'), present('full_brother'), present('full_sister', 2)],
    expected: {
      grandfather: { fraction: '1/3', amount: 50_000 },
      full_brother: { fraction: '1/3', amount: 50_000 },
      full_sister: { fraction: '1/3', amount: 50_000, individualAmounts: [25_000, 25_000] },
    },
  },
  {
    id: 'art158-wife-grandfather-full-brother-post-fard-muqasama',
    basis: 'Article 158 with a fixed-share heir: after wife quarter, grandfather and one full brother divide the three-quarter residue equally',
    estate: 400_000,
    heirs: [present('wife'), present('grandfather'), present('full_brother')],
    expected: {
      wife: { fraction: '1/4', amount: 100_000 },
      grandfather: { fraction: '3/8', amount: 150_000 },
      full_brother: { fraction: '3/8', amount: 150_000 },
    },
  },
  {
    id: 'art158-husband-grandfather-full-sister-post-fard-muqasama',
    basis: 'Article 158 with a fixed-share heir: husband half; grandfather and one full sister divide the remaining half in two-to-one ratio',
    estate: 120_000,
    heirs: [present('husband'), present('grandfather'), present('full_sister')],
    expected: {
      husband: { fraction: '1/2', amount: 60_000 },
      grandfather: { fraction: '1/3', amount: 40_000 },
      full_sister: { fraction: '1/6', amount: 20_000 },
    },
  },
];

function resultFor(results: CalculationResult[], heirId: string): CalculationResult {
  const result = results.find(row => row.heirId === heirId);
  expect(result, `Missing heir result: ${heirId}`).toBeDefined();
  return result!;
}

function calculate(testCase: ReferenceCase): CalculationResult[] {
  return calculateInheritance(
    testCase.heirs,
    testCase.estate,
    0,
    0,
    0,
    false,
    [],
    'stillborn',
    false,
    true,
  );
}

describe('Article 158 — independent numerical reference matrix (low-level arithmetic)', () => {
  it.each(referenceCases)('$id', testCase => {
    const results = calculate(testCase);

    for (const [heirId, expected] of Object.entries(testCase.expected)) {
      const actual = resultFor(results, heirId);
      expect(actual.shareFraction.toFraction(), `${testCase.id}: ${heirId} fraction`)
        .toBe(expected.fraction);
      expect(actual.amount, `${testCase.id}: ${heirId} amount`)
        .toBe(expected.amount);
      expect(actual.isBlocked, `${testCase.id}: ${heirId} blocked status`)
        .toBe(Boolean(expected.blocked));

      if (expected.individualAmounts) {
        expect(actual.individuals?.map(person => person.amount))
          .toEqual(expected.individualAmounts);
      }
    }

    expect(
      results.reduce((sum, row) => sum + row.amount, 0),
      `${testCase.id}: estate conservation`,
    ).toBe(testCase.estate);
  });
});

describe('Article 158 — production review boundary remains fail-closed', () => {
  it.each(referenceCases.filter(testCase =>
    testCase.heirs.some(h => ['full_brother', 'full_sister'].includes(h.heirId)) &&
    testCase.heirs.some(h => ['paternal_brother', 'paternal_sister'].includes(h.heirId)),
  ))('$id remains held for legal classification in the production orchestrator', testCase => {
    const stage: MunasakhatStage = {
      id: 'art158-mixed-reference',
      deceasedName: 'مرجع المعادّة',
      hasMandatoryBequest: false,
      confirmedSpouseEligibility: true,
      heirs: testCase.heirs,
    };

    const [stageResult] = runInheritanceOrchestration([[
      stage,
    ], testCase.estate, 0, 0, 0]);

    expect(stageResult.requiresManualClassification).toBe(true);
    expect(stageResult.results).toEqual([]);
  });
});

describe('Article 158 — reference fixture integrity', () => {
  it('keeps every expected fraction sum equal to the whole estate for complete fixtures', () => {
    for (const testCase of referenceCases) {
      const sum = Object.values(testCase.expected)
        .reduce((total, expected) => total + Number(expected.fraction.split('/')[0]) /
          Number(expected.fraction.split('/')[1] ?? 1), 0);
      expect(sum, testCase.id).toBeCloseTo(1, 12);
    }
  });
});
