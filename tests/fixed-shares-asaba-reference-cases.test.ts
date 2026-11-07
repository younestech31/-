import { describe, expect, it } from 'vitest';
import {
  calculateInheritance,
  type CalculationResult,
  type HeirPresence,
} from '@/lib/inheritance/inheritance-calculator';

const present = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

type Expected = {
  fraction: string;
  amount: number;
  individuals?: Array<{ fraction: string; amount: number }>;
};

type ReferenceCase = {
  id: string;
  article: string;
  estate: number;
  heirs: HeirPresence[];
  expected: Record<string, Expected>;
  blocked?: string[];
  calculationType?: 'normal' | 'awl' | 'radd';
};

function getResult(results: CalculationResult[], heirId: string): CalculationResult {
  const result = results.find(item => item.heirId === heirId);
  expect(result, `Missing result row for ${heirId}`).toBeDefined();
  return result!;
}

/**
 * Independent statutory fixtures for the fixed-share and residuary pipeline.
 * Expected fractions are written from the legal scenario descriptions, not
 * generated from HEIRS, BLOCKING_RULES, or AWL_RADD_RULES.
 *
 * Group shares are asserted separately from per-person allocations, because
 * a grouped heir is a single result row that represents multiple people.
 */
const referenceCases: ReferenceCase[] = [
  {
    id: 'art144-145-167-husband-with-one-daughter-radd',
    article: '144, 145, 167',
    estate: 240_000,
    heirs: [present('husband'), present('daughter')],
    expected: {
      husband: { fraction: '1/4', amount: 60_000 },
      daughter: { fraction: '3/4', amount: 180_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art145-146-167-wife-with-one-daughter-radd',
    article: '145, 146, 167',
    estate: 240_000,
    heirs: [present('wife'), present('daughter')],
    expected: {
      wife: { fraction: '1/8', amount: 30_000 },
      daughter: { fraction: '7/8', amount: 210_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art144-151-155-son-and-daughter-two-to-one',
    article: '144, 151, 152, 155',
    estate: 240_000,
    heirs: [present('son'), present('daughter')],
    expected: {
      son: {
        fraction: '2/3',
        amount: 160_000,
        individuals: [{ fraction: '2/3', amount: 160_000 }],
      },
      daughter: { fraction: '1/3', amount: 80_000 },
    },
  },
  {
    id: 'art145-151-155-wife-two-sons-one-daughter',
    article: '145, 151, 155',
    estate: 240_000,
    heirs: [present('wife'), present('son', 2), present('daughter')],
    expected: {
      wife: { fraction: '1/8', amount: 30_000 },
      son: {
        fraction: '7/10',
        amount: 168_000,
        individuals: [
          { fraction: '7/20', amount: 84_000 },
          { fraction: '7/20', amount: 84_000 },
        ],
      },
      daughter: { fraction: '7/40', amount: 42_000 },
    },
  },
  {
    id: 'art145-146-wife-group-shared-equally-before-asaba',
    article: '145, 146, 151',
    estate: 240_000,
    heirs: [present('wife', 2), present('son')],
    expected: {
      wife: {
        fraction: '1/8',
        amount: 30_000,
        individuals: [
          { fraction: '1/16', amount: 15_000 },
          { fraction: '1/16', amount: 15_000 },
        ],
      },
      son: { fraction: '7/8', amount: 210_000 },
    },
  },
  {
    id: 'art148-149-father-mother-son',
    article: '148, 149, 152, 153',
    estate: 240_000,
    heirs: [present('mother'), present('father'), present('son')],
    expected: {
      mother: { fraction: '1/6', amount: 40_000 },
      father: { fraction: '1/6', amount: 40_000 },
      son: { fraction: '2/3', amount: 160_000 },
    },
  },
  {
    id: 'art145-148-149-father-mother-wife-son',
    article: '145, 148, 149, 152, 153',
    estate: 240_000,
    heirs: [present('wife'), present('mother'), present('father'), present('son')],
    expected: {
      wife: { fraction: '1/8', amount: 30_000 },
      mother: { fraction: '1/6', amount: 40_000 },
      father: { fraction: '1/6', amount: 40_000 },
      son: { fraction: '13/24', amount: 130_000 },
    },
  },
  {
    id: 'art144-147-149-father-with-two-daughters',
    article: '147, 149, 150, 153',
    estate: 240_000,
    heirs: [present('father'), present('daughter', 2)],
    expected: {
      father: { fraction: '1/3', amount: 80_000 },
      daughter: {
        fraction: '2/3',
        amount: 160_000,
        individuals: [
          { fraction: '1/3', amount: 80_000 },
          { fraction: '1/3', amount: 80_000 },
        ],
      },
    },
  },
  {
    id: 'art144-145-147-149-wife-two-daughters-full-brother-residue',
    article: '145, 147, 149, 150, 153',
    estate: 240_000,
    heirs: [present('wife'), present('daughter', 2), present('full_brother')],
    expected: {
      wife: { fraction: '1/8', amount: 30_000 },
      daughter: { fraction: '2/3', amount: 160_000 },
      full_brother: { fraction: '5/24', amount: 50_000 },
    },
  },
  {
    id: 'art144-153-154-son-and-two-daughters-group-ratio',
    article: '144, 151, 153, 154, 155',
    estate: 240_000,
    heirs: [present('son'), present('daughter', 2)],
    expected: {
      son: { fraction: '1/2', amount: 120_000 },
      daughter: {
        fraction: '1/2',
        amount: 120_000,
        individuals: [
          { fraction: '1/4', amount: 60_000 },
          { fraction: '1/4', amount: 60_000 },
        ],
      },
    },
  },
  {
    id: 'art144-151-155-two-sons-one-daughter-individual-correction',
    article: '144, 151, 154, 155',
    estate: 240_000,
    heirs: [present('son', 2), present('daughter')],
    expected: {
      son: {
        fraction: '4/5',
        amount: 192_000,
        individuals: [
          { fraction: '2/5', amount: 96_000 },
          { fraction: '2/5', amount: 96_000 },
        ],
      },
      daughter: { fraction: '1/5', amount: 48_000 },
    },
  },
  {
    id: 'art144-153-154-descendant-class-precedes-sibling-asaba',
    article: '144, 153, 154, 164',
    estate: 240_000,
    heirs: [present('son'), present('full_brother')],
    expected: {
      son: { fraction: '1', amount: 240_000 },
    },
    blocked: ['full_brother'],
  },
  {
    id: 'art144-149-150-father-sixth-plus-residue-with-one-daughter',
    article: '144, 149, 150, 153',
    estate: 240_000,
    heirs: [present('wife'), present('mother'), present('father'), present('daughter')],
    expected: {
      wife: { fraction: '1/8', amount: 30_000 },
      mother: { fraction: '1/6', amount: 40_000 },
      father: { fraction: '5/24', amount: 50_000 },
      daughter: { fraction: '1/2', amount: 120_000 },
    },
  },
  {
    id: 'art144-149-153-wife-two-daughters-father-awl',
    article: '145, 147, 149, 166',
    estate: 270_000,
    heirs: [present('wife'), present('daughter', 2), present('father'), present('mother')],
    expected: {
      wife: { fraction: '1/9', amount: 30_000 },
      daughter: { fraction: '16/27', amount: 160_000 },
      father: { fraction: '4/27', amount: 40_000 },
      mother: { fraction: '4/27', amount: 40_000 },
    },
    calculationType: 'awl',
  },
  {
    id: 'art144-147-148-husband-mother-two-full-sisters-awl',
    article: '144, 147, 148, 166',
    estate: 240_000,
    heirs: [present('husband'), present('mother'), present('full_sister', 2)],
    expected: {
      husband: { fraction: '3/8', amount: 90_000 },
      mother: { fraction: '1/8', amount: 30_000 },
      full_sister: {
        fraction: '1/2',
        amount: 120_000,
        individuals: [
          { fraction: '1/4', amount: 60_000 },
          { fraction: '1/4', amount: 60_000 },
        ],
      },
    },
    calculationType: 'awl',
  },
  {
    id: 'art144-147-148-husband-mother-two-daughters-awl',
    article: '144, 147, 148, 166',
    estate: 260_000,
    heirs: [present('husband'), present('mother'), present('daughter', 2)],
    expected: {
      husband: { fraction: '3/13', amount: 60_000 },
      mother: { fraction: '2/13', amount: 40_000 },
      daughter: { fraction: '8/13', amount: 160_000 },
    },
    calculationType: 'awl',
  },
  {
    id: 'art144-156-one-daughter-and-full-sister-asaba-with-other',
    article: '144, 156',
    estate: 240_000,
    heirs: [present('daughter'), present('full_sister')],
    expected: {
      daughter: { fraction: '1/2', amount: 120_000 },
      full_sister: { fraction: '1/2', amount: 120_000 },
    },
  },
  {
    id: 'art144-156-two-daughters-and-full-sister-asaba-with-other',
    article: '147, 156',
    estate: 240_000,
    heirs: [present('daughter', 2), present('full_sister')],
    expected: {
      daughter: { fraction: '2/3', amount: 160_000 },
      full_sister: { fraction: '1/3', amount: 80_000 },
    },
  },
  {
    id: 'art144-156-two-daughters-and-two-full-sisters-asaba-with-other',
    article: '147, 156',
    estate: 240_000,
    heirs: [present('daughter', 2), present('full_sister', 2)],
    expected: {
      daughter: { fraction: '2/3', amount: 160_000 },
      full_sister: {
        fraction: '1/3',
        amount: 80_000,
        individuals: [
          { fraction: '1/6', amount: 40_000 },
          { fraction: '1/6', amount: 40_000 },
        ],
      },
    },
  },
  {
    id: 'art144-155-one-daughter-full-brother-and-full-sister-ratio',
    article: '144, 151, 155',
    estate: 240_000,
    heirs: [present('daughter'), present('full_brother'), present('full_sister')],
    expected: {
      daughter: { fraction: '1/2', amount: 120_000 },
      full_brother: { fraction: '1/3', amount: 80_000 },
      full_sister: { fraction: '1/6', amount: 40_000 },
    },
  },
  {
    id: 'art144-156-one-daughter-paternal-sister-asaba-with-other',
    article: '144, 156, 157',
    estate: 240_000,
    heirs: [present('daughter'), present('paternal_sister')],
    expected: {
      daughter: { fraction: '1/2', amount: 120_000 },
      paternal_sister: { fraction: '1/2', amount: 120_000 },
    },
  },
  {
    id: 'art144-156-two-daughters-paternal-sister-asaba-with-other',
    article: '147, 156, 157',
    estate: 240_000,
    heirs: [present('daughter', 2), present('paternal_sister')],
    expected: {
      daughter: { fraction: '2/3', amount: 160_000 },
      paternal_sister: { fraction: '1/3', amount: 80_000 },
    },
  },
  {
    id: 'art144-147-157-full-sister-and-paternal-sister-radd',
    article: '144, 147, 157, 167',
    estate: 240_000,
    heirs: [present('full_sister'), present('paternal_sister')],
    expected: {
      full_sister: { fraction: '3/4', amount: 180_000 },
      paternal_sister: { fraction: '1/4', amount: 60_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art144-147-164-two-full-sisters-block-paternal-sister',
    article: '147, 164, 167',
    estate: 240_000,
    heirs: [present('full_sister', 2), present('paternal_sister')],
    expected: {
      full_sister: { fraction: '1', amount: 240_000 },
    },
    blocked: ['paternal_sister'],
    calculationType: 'radd',
  },
  {
    id: 'art148-maternal-sibling-single-share-with-radd',
    article: '148, 149, 167',
    estate: 240_000,
    heirs: [present('maternal_siblings')],
    expected: {
      maternal_siblings: { fraction: '1', amount: 240_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art148-maternal-sibling-group-equal-per-head-with-radd',
    article: '148, 149, 167',
    estate: 240_000,
    heirs: [present('maternal_siblings', 3)],
    expected: {
      maternal_siblings: {
        fraction: '1',
        amount: 240_000,
        individuals: [
          { fraction: '1/3', amount: 80_000 },
          { fraction: '1/3', amount: 80_000 },
          { fraction: '1/3', amount: 80_000 },
        ],
      },
    },
    calculationType: 'radd',
  },
  {
    id: 'art148-mother-reduced-by-two-siblings-even-when-blocked-by-son',
    article: '148, 149, 162',
    estate: 240_000,
    heirs: [present('mother'), present('son'), present('full_brother', 2)],
    expected: {
      mother: { fraction: '1/6', amount: 40_000 },
      son: { fraction: '5/6', amount: 200_000 },
    },
    blocked: ['full_brother'],
  },
  {
    id: 'art149-161-two-grandmothers-share-the-sixth-before-radd',
    article: '149, 161, 167',
    estate: 240_000,
    heirs: [present('maternal_grandmother'), present('paternal_grandmother')],
    expected: {
      maternal_grandmother: { fraction: '1/2', amount: 120_000 },
      paternal_grandmother: { fraction: '1/2', amount: 120_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art145-149-one-grandmother-with-spouse-radd-goes-to-relative-fard',
    article: '145, 149, 167',
    estate: 240_000,
    heirs: [present('husband'), present('maternal_grandmother')],
    expected: {
      husband: { fraction: '1/2', amount: 120_000 },
      maternal_grandmother: { fraction: '1/2', amount: 120_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art145-148-wife-and-mother-radd-not-to-spouse',
    article: '145, 148, 167',
    estate: 240_000,
    heirs: [present('wife'), present('mother')],
    expected: {
      wife: { fraction: '1/4', amount: 60_000 },
      mother: { fraction: '3/4', amount: 180_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art144-145-149-wife-mother-two-daughters-father-awl-canonical',
    article: '145, 147, 149, 166, 179',
    estate: 270_000,
    heirs: [present('wife'), present('daughter', 2), present('father'), present('mother')],
    expected: {
      wife: { fraction: '1/9', amount: 30_000 },
      daughter: { fraction: '16/27', amount: 160_000 },
      father: { fraction: '4/27', amount: 40_000 },
      mother: { fraction: '4/27', amount: 40_000 },
    },
    calculationType: 'awl',
  },
];

describe('Independent fixed-share and residuary reference matrix (Arts. 143–157, 160, 166–167)', () => {
  it.each(referenceCases)('$id — Arts. $article', testCase => {
    const results = calculateInheritance(
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

    for (const [heirId, expected] of Object.entries(testCase.expected)) {
      const actual = getResult(results, heirId);
      expect(actual.shareFraction.toFraction(), heirId).toBe(expected.fraction);
      expect(actual.amount, heirId).toBe(expected.amount);
      expect(actual.isBlocked, heirId).toBe(false);

      if (expected.individuals) {
        expect(actual.individuals, `${heirId} individual allocations`).toHaveLength(expected.individuals.length);
        actual.individuals?.forEach((person, index) => {
          expect(person.shareFraction.toFraction(), `${heirId} individual ${index + 1} fraction`)
            .toBe(expected.individuals![index].fraction);
          expect(person.amount, `${heirId} individual ${index + 1} amount`)
            .toBe(expected.individuals![index].amount);
        });
      }
    }

    for (const heirId of testCase.blocked ?? []) {
      const blocked = getResult(results, heirId);
      expect(blocked.isBlocked, heirId).toBe(true);
      expect(blocked.amount, heirId).toBe(0);
    }

    expect(
      results.reduce((sum, result) => sum + result.amount, 0),
      `${testCase.id} estate conservation`,
    ).toBe(testCase.estate);

    if (testCase.calculationType) {
      expect(results.some(result => result.calculationType === testCase.calculationType)).toBe(true);
    }
  });
});

describe('Independent fraction and individual-allocation invariants', () => {
  it('keeps every non-blocked share non-negative and prevents total allocations above the distributable estate', () => {
    const scenarios: HeirPresence[][] = [
      [present('wife'), present('mother'), present('father'), present('daughter')],
      [present('husband'), present('mother'), present('full_sister', 2)],
      [present('wife'), present('daughter', 2), present('full_brother')],
      [present('son', 2), present('daughter')],
      [present('full_sister'), present('paternal_sister')],
    ];

    for (const heirs of scenarios) {
      const results = calculateInheritance(heirs, 1_000_003, 0, 0, 0, false, [], 'stillborn', false, true);
      for (const result of results) {
        if (!result.isBlocked) expect(result.shareFraction.compare(0)).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(result.amount)).toBe(true);
      }
      expect(results.reduce((sum, result) => sum + result.amount, 0)).toBeLessThanOrEqual(1_000_003);
    }
  });

  it('keeps grouped individual allocations equal when the total group amount divides exactly', () => {
    const results = calculateInheritance(
      [present('wife', 2), present('son', 2), present('daughter')],
      240_000,
      0, 0, 0,
    );
    const wives = getResult(results, 'wife');
    const sons = getResult(results, 'son');

    expect(wives.individuals?.map(person => person.amount)).toEqual([15_000, 15_000]);
    expect(sons.individuals?.map(person => person.amount)).toEqual([84_000, 84_000]);
  });

  it('conserves fractional DZD at centime precision across fixed shares and residue', () => {
    const results = calculateInheritance(
      [present('wife'), present('son')],
      1_000.01,
      0,
      0,
      0,
      false,
      [],
      'stillborn',
      false,
      true,
    );

    const wife = getResult(results, 'wife');
    const son = getResult(results, 'son');

    expect(wife.shareFraction.toFraction()).toBe('1/8');
    expect(son.shareFraction.toFraction()).toBe('7/8');
    expect(wife.amount).toBe(125);
    expect(son.amount).toBe(875.01);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(1_000.01);
  });

  it('does not round a legally held spouse-only residue into the spouse allocation', () => {
    const results = calculateInheritance(
      [present('wife')],
      1_000.01,
      0,
      0,
      0,
      false,
      [],
      'stillborn',
      false,
      false,
    );

    const wife = getResult(results, 'wife');
    const review = getResult(results, 'article_180_review');

    expect(wife.shareFraction.toFraction()).toBe('1/4');
    expect(wife.amount).toBe(250);
    expect(review.amount).toBe(0);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(250);
  });

  it('distributes indivisible group amounts at centime precision without losing or creating value', () => {
    const results = calculateInheritance(
      [present('son', 3)],
      240_001,
      0, 0, 0,
    );
    const sons = getResult(results, 'son');
    const amounts = sons.individuals?.map(person => person.amount) ?? [];

    expect(amounts).toEqual([80_000.34, 80_000.33, 80_000.33]);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(sons.amount);
    expect(sons.individuals?.reduce((sum, person) => sum + person.shares, 0)).toBe(sons.shares);
  });
});
