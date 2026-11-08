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
    id: 'art158-grandfather-one-full-sister-no-other-fixed-heirs',
    basis: 'Article 158: muqasama gives the grandfather two of three shares against one full sister; this exceeds one-third of the estate',
    estate: 300_000,
    heirs: [present('grandfather'), present('full_sister')],
    expected: {
      grandfather: { fraction: '2/3', amount: 200_000 },
      full_sister: { fraction: '1/3', amount: 100_000 },
    },
  },
  {
    id: 'art158-grandfather-two-full-sisters-no-other-fixed-heirs',
    basis: 'Article 158: muqasama gives the grandfather two of four shares against two full sisters',
    estate: 300_000,
    heirs: [present('grandfather'), present('full_sister', 2)],
    expected: {
      grandfather: { fraction: '1/2', amount: 150_000 },
      full_sister: {
        fraction: '1/2',
        amount: 150_000,
        individualAmounts: [75_000, 75_000],
      },
    },
  },
  {
    id: 'art158-grandfather-one-paternal-sister-no-other-fixed-heirs',
    basis: 'Article 158: with paternal siblings only, muqasama gives the grandfather two of three shares against one paternal sister',
    estate: 300_000,
    heirs: [present('grandfather'), present('paternal_sister')],
    expected: {
      grandfather: { fraction: '2/3', amount: 200_000 },
      paternal_sister: { fraction: '1/3', amount: 100_000 },
    },
  },
  {
    id: 'art158-grandfather-two-paternal-sisters-no-other-fixed-heirs',
    basis: 'Article 158: muqasama gives the grandfather two of four shares against two paternal sisters',
    estate: 300_000,
    heirs: [present('grandfather'), present('paternal_sister', 2)],
    expected: {
      grandfather: { fraction: '1/2', amount: 150_000 },
      paternal_sister: {
        fraction: '1/2',
        amount: 150_000,
        individualAmounts: [75_000, 75_000],
      },
    },
  },
  {
    id: 'art158-wife-grandfather-one-full-sister',
    basis: 'Wife receives 1/4; among the 3/4 residue, muqasama gives the grandfather 2/3 and the full sister 1/3',
    estate: 400_000,
    heirs: [present('wife'), present('grandfather'), present('full_sister')],
    expected: {
      wife: { fraction: '1/4', amount: 100_000 },
      grandfather: { fraction: '1/2', amount: 200_000 },
      full_sister: { fraction: '1/4', amount: 100_000 },
    },
  },
  {
    id: 'art158-daughter-grandfather-one-full-sister',
    basis: 'Daughter receives 1/2; muqasama gives the grandfather 1/3 of the estate and the sister receives the remaining 1/6',
    estate: 360_000,
    heirs: [present('daughter'), present('grandfather'), present('full_sister')],
    expected: {
      daughter: { fraction: '1/2', amount: 180_000 },
      grandfather: { fraction: '1/3', amount: 120_000 },
      full_sister: { fraction: '1/6', amount: 60_000 },
    },
  },
  {
    id: 'art158-mother-grandfather-one-full-sister',
    basis: 'Mother receives 1/3; muqasama is the best option for the grandfather, two of three shares in the remaining 2/3',
    estate: 360_000,
    heirs: [present('mother'), present('grandfather'), present('full_sister')],
    expected: {
      mother: { fraction: '1/3', amount: 120_000 },
      grandfather: { fraction: '4/9', amount: 160_000 },
      full_sister: { fraction: '2/9', amount: 80_000 },
    },
  },
  {
    id: 'art158-mother-grandfather-two-full-sisters',
    basis: 'Mother is reduced to 1/6 for the sibling group; muqasama gives the grandfather half of the remaining 5/6',
    estate: 360_000,
    heirs: [present('mother'), present('grandfather'), present('full_sister', 2)],
    expected: {
      mother: { fraction: '1/6', amount: 60_000 },
      grandfather: { fraction: '5/12', amount: 150_000 },
      full_sister: {
        fraction: '5/12',
        amount: 150_000,
        individualAmounts: [75_000, 75_000],
      },
    },
  },
  {
    id: 'art158-daughter-grandfather-full-brother',
    basis: 'Daughter receives 1/2; muqasama between the grandfather and one full brother divides the residue equally',
    estate: 360_000,
    heirs: [present('daughter'), present('grandfather'), present('full_brother')],
    expected: {
      daughter: { fraction: '1/2', amount: 180_000 },
      grandfather: { fraction: '1/4', amount: 90_000 },
      full_brother: { fraction: '1/4', amount: 90_000 },
    },
  },
  {
    id: 'art158-two-daughters-grandfather-full-brother',
    basis: 'Two daughters receive 2/3; the grandfather and full brother divide the remaining 1/3 equally',
    estate: 360_000,
    heirs: [present('daughter', 2), present('grandfather'), present('full_brother')],
    expected: {
      daughter: {
        fraction: '2/3',
        amount: 240_000,
        individualAmounts: [120_000, 120_000],
      },
      grandfather: { fraction: '1/6', amount: 60_000 },
      full_brother: { fraction: '1/6', amount: 60_000 },
    },
  },
  {
    id: 'art158-grandfather-paternal-brother-and-sister-no-other-fixed-heirs',
    basis: 'Muqasama treats the grandfather as two shares, paternal brother as two, and paternal sister as one',
    estate: 300_000,
    heirs: [present('grandfather'), present('paternal_brother'), present('paternal_sister')],
    expected: {
      grandfather: { fraction: '2/5', amount: 120_000 },
      paternal_brother: { fraction: '2/5', amount: 120_000 },
      paternal_sister: { fraction: '1/5', amount: 60_000 },
    },
  },

  {
    id: 'art158-grandfather-one-third-of-whole-estate-prevails-with-four-full-brothers',
    basis: 'Without other fixed-share heirs, one-third of the whole estate is better for the grandfather than muqasama with four full brothers',
    estate: 360_000,
    heirs: [present('grandfather'), present('full_brother', 4)],
    expected: {
      grandfather: { fraction: '1/3', amount: 120_000 },
      full_brother: {
        fraction: '2/3',
        amount: 240_000,
        individualAmounts: [60_000, 60_000, 60_000, 60_000],
      },
    },
  },
  {
    id: 'art158-one-third-of-remainder-prevails-with-wife-and-three-full-brothers',
    basis: 'After the wife receives 1/4, one-third of the 3/4 residue gives the grandfather 1/4, more than muqasama',
    estate: 360_000,
    heirs: [present('wife'), present('grandfather'), present('full_brother', 3)],
    expected: {
      wife: { fraction: '1/4', amount: 90_000 },
      grandfather: { fraction: '1/4', amount: 90_000 },
      full_brother: {
        fraction: '1/2',
        amount: 180_000,
        individualAmounts: [60_000, 60_000, 60_000],
      },
    },
  },
  {
    id: 'art158-one-sixth-of-whole-estate-prevails-with-wife-two-daughters-and-four-full-brothers',
    basis: "With wife and daughters, the grandfather's 1/6 of the whole estate exceeds both one-third of the remaining 5/24 and muqasama against four brothers",
    estate: 360_000,
    heirs: [
      present('wife'),
      present('daughter', 2),
      present('grandfather'),
      present('full_brother', 4),
    ],
    expected: {
      wife: { fraction: '1/8', amount: 45_000 },
      daughter: {
        fraction: '2/3',
        amount: 240_000,
        individualAmounts: [120_000, 120_000],
      },
      grandfather: { fraction: '1/6', amount: 60_000 },
      full_brother: {
        fraction: '1/24',
        amount: 15_000,
        individualAmounts: [3_750, 3_750, 3_750, 3_750],
      },
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

describe('Grandfather blocking boundaries around Article 158', () => {
  it('blocks the paternal grandfather when the father is present', () => {
    const results = calculateInheritance([
      present('father'),
      present('grandfather'),
      present('maternal_siblings'),
    ], 120_000, 0, 0, 0, false, [], 'stillborn', false, true);

    expect(resultFor(results, 'father').shareFraction.toFraction()).toBe('1');
    expect(resultFor(results, 'father').amount).toBe(120_000);
    expect(resultFor(results, 'grandfather').isBlocked).toBe(true);
    expect(resultFor(results, 'maternal_siblings').isBlocked).toBe(true);
  });

  it('blocks maternal siblings when the grandfather is the nearest male ascendant', () => {
    const results = calculateInheritance([
      present('grandfather'),
      present('maternal_siblings', 2),
    ], 120_000, 0, 0, 0, false, [], 'stillborn', false, true);

    expect(resultFor(results, 'grandfather').shareFraction.toFraction()).toBe('1');
    expect(resultFor(results, 'grandfather').amount).toBe(120_000);
    expect(resultFor(results, 'maternal_siblings').isBlocked).toBe(true);
    expect(resultFor(results, 'maternal_siblings').amount).toBe(0);
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
