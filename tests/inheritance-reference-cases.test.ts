import { describe, expect, it } from 'vitest';
import {
  calculateInheritance,
  calculateInheritanceInternal,
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

type ExpectedShare = {
  fraction: string;
  amount: number;
};

type ReferenceCase = {
  id: string;
  article: number;
  facts: string;
  estate: number;
  heirs: HeirPresence[];
  confirmedNoDistantKindred?: boolean;
  expected: Record<string, ExpectedShare>;
  calculationType?: 'normal' | 'awl' | 'radd';
};

function resultFor(results: CalculationResult[], heirId: string): CalculationResult {
  const result = results.find(row => row.heirId === heirId);
  expect(result, `Expected heir result: ${heirId}`).toBeDefined();
  return result!;
}

/**
 * Independent fixtures: expected fractions are derived from the statutory
 * case descriptions, not imported from the calculator's own rule tables.
 * Group fractions and group amounts are asserted; per-person division is
 * asserted separately where it matters.
 */
const statutoryCases: ReferenceCase[] = [
  {
    id: 'art158-grandfather-two-full-brothers-no-furud',
    article: 158,
    facts: 'الجد مع أخوين شقيقين دون أصحاب فروض: ثلث جميع المال يساوي المقاسمة أو يفوقها',
    estate: 300_000,
    heirs: [present('grandfather'), present('full_brother', 2)],
    expected: {
      grandfather: { fraction: '1/3', amount: 100_000 },
      full_brother: { fraction: '2/3', amount: 200_000 },
    },
  },
  {
    id: 'art158-grandfather-one-full-brother-no-furud',
    article: 158,
    facts: 'الجد مع أخ شقيق واحد دون أصحاب فروض: المقاسمة نصف التركة وهي الأحظ',
    estate: 300_000,
    heirs: [present('grandfather'), present('full_brother')],
    expected: {
      grandfather: { fraction: '1/2', amount: 150_000 },
      full_brother: { fraction: '1/2', amount: 150_000 },
    },
  },
  {
    id: 'art158-wife-grandfather-two-full-brothers',
    article: 158,
    facts: 'زوجة و الجد وأخوان شقيقان: الزوجة الربع، والجد الأحظ له ربع الباقي بعد الفرض، والأخوان يتقاسمان النصف',
    estate: 400_000,
    heirs: [present('wife'), present('grandfather'), present('full_brother', 2)],
    expected: {
      wife: { fraction: '1/4', amount: 100_000 },
      grandfather: { fraction: '1/4', amount: 100_000 },
      full_brother: { fraction: '1/2', amount: 200_000 },
    },
  },
  {
    id: 'art158-grandfather-paternal-sister-only',
    article: 158,
    facts: 'الجد مع أخت واحدة لأب دون أصحاب فروض: يقارن الثلث بالمقاسمة، والمقاسمة تعطي الجد ثلثي المال',
    estate: 300_000,
    heirs: [present('grandfather'), present('paternal_sister')],
    expected: {
      grandfather: { fraction: '2/3', amount: 200_000 },
      paternal_sister: { fraction: '1/3', amount: 100_000 },
    },
  },
  {
    id: 'art158-kharqaa-mother-grandfather-full-sister',
    article: 158,
    facts: 'الأم والجد والأخت الشقيقة: الأم الثلث، والجد يقارن السدس وثلث الباقي والمقاسمة؛ المقاسمة تعطيه 80,000',
    estate: 180_000,
    heirs: [present('mother'), present('grandfather'), present('full_sister')],
    expected: {
      mother: { fraction: '1/3', amount: 60_000 },
      grandfather: { fraction: '4/9', amount: 80_000 },
      full_sister: { fraction: '2/9', amount: 40_000 },
    },
  },
  {
    id: 'art175-akdariyya-full-sister',
    article: 175,
    facts: 'الأكدرية بالنص: الزوج 9/27، الأم 6/27، الأخت 4/27، الجد 8/27',
    estate: 270_000,
    heirs: [present('husband'), present('mother'), present('full_sister'), present('grandfather')],
    expected: {
      husband: { fraction: '1/3', amount: 90_000 },
      mother: { fraction: '2/9', amount: 60_000 },
      full_sister: { fraction: '4/27', amount: 40_000 },
      grandfather: { fraction: '8/27', amount: 80_000 },
    },
  },
  {
    id: 'art175-akdariyya-paternal-sister',
    article: 175,
    facts: 'المادة 175 تذكر الأخت الشقيقة أو لأب؛ يختبر هذا المثال امتداد الأكدرية للأخت لأب',
    estate: 270_000,
    heirs: [present('husband'), present('mother'), present('paternal_sister'), present('grandfather')],
    expected: {
      husband: { fraction: '1/3', amount: 90_000 },
      mother: { fraction: '2/9', amount: 60_000 },
      paternal_sister: { fraction: '4/27', amount: 40_000 },
      grandfather: { fraction: '8/27', amount: 80_000 },
    },
  },
  {
    id: 'art176-mushtaraka',
    article: 176,
    facts: 'الزوج النصف، الأم السدس، والثلث مشترك بالتساوي بين الأخوين لأم والأخ الشقيق على عدد الرؤوس',
    estate: 600_000,
    heirs: [
      present('husband'),
      present('mother'),
      present('maternal_siblings', 2),
      present('full_brother'),
    ],
    expected: {
      husband: { fraction: '1/2', amount: 300_000 },
      mother: { fraction: '1/6', amount: 100_000 },
      maternal_siblings: { fraction: '2/9', amount: 133_333.33 },
      full_brother: { fraction: '1/9', amount: 66_666.67 },
    },
  },
  {
    id: 'art177-gharrawain-husband',
    article: 177,
    facts: 'زوج وأبوان: الزوج النصف، الأم ثلث الباقي (السدس)، والأب الباقي',
    estate: 600_000,
    heirs: [present('husband'), present('mother'), present('father')],
    expected: {
      husband: { fraction: '1/2', amount: 300_000 },
      mother: { fraction: '1/6', amount: 100_000 },
      father: { fraction: '1/3', amount: 200_000 },
    },
  },
  {
    id: 'art177-gharrawain-wife',
    article: 177,
    facts: 'زوجة وأبوان: الزوجة الربع، الأم ثلث الباقي (الربع)، والأب الباقي',
    estate: 600_000,
    heirs: [present('wife'), present('mother'), present('father')],
    expected: {
      wife: { fraction: '1/4', amount: 150_000 },
      mother: { fraction: '1/4', amount: 150_000 },
      father: { fraction: '1/2', amount: 300_000 },
    },
  },
  {
    id: 'art178-mubahala',
    article: 178,
    facts: 'المباهلة: أصلها 6 وتعول إلى 8؛ الزوج 3/8، الأخت 3/8، الأم 2/8',
    estate: 240_000,
    heirs: [present('husband'), present('mother'), present('full_sister')],
    expected: {
      husband: { fraction: '3/8', amount: 90_000 },
      full_sister: { fraction: '3/8', amount: 90_000 },
      mother: { fraction: '1/4', amount: 60_000 },
    },
    calculationType: 'awl',
  },
  {
    id: 'art179-minbariyya',
    article: 179,
    facts: 'المنبرية: أصلها 24 وتعول إلى 27؛ الزوجة 3/27، البنتان 16/27، الأب 4/27، الأم 4/27',
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
    id: 'art167-radd-daughter-mother',
    article: 167,
    facts: 'بنت وأم دون عصبة أو زوج: يرد الباقي على غير الزوجين بنسبة الفروض؛ النتيجة 3/4 للبنت و1/4 للأم',
    estate: 400_000,
    heirs: [present('daughter'), present('mother')],
    expected: {
      daughter: { fraction: '3/4', amount: 300_000 },
      mother: { fraction: '1/4', amount: 100_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art167-wife-only-after-confirming-no-distant-kindred',
    article: 167,
    facts: 'زوجة فقط بعد التأكد من عدم وجود عصبة نسبية أو أصحاب فروض نسبية أو ذوي أرحام: يرد الباقي إلى الزوجة',
    estate: 240_000,
    heirs: [present('wife')],
    confirmedNoDistantKindred: true,
    expected: {
      wife: { fraction: '1', amount: 240_000 },
    },
    calculationType: 'radd',
  },
  {
    id: 'art167-husband-only-after-confirming-no-distant-kindred',
    article: 167,
    facts: 'زوج فقط بعد التأكد من عدم وجود عصبة نسبية أو أصحاب فروض نسبية أو ذوي أرحام: يرد الباقي إلى الزوج',
    estate: 240_000,
    heirs: [present('husband')],
    confirmedNoDistantKindred: true,
    expected: {
      husband: { fraction: '1', amount: 240_000 },
    },
    calculationType: 'radd',
  },
];

describe('Statute-derived independent inheritance reference cases', () => {
  it.each(statutoryCases)('$id — Article $article', testCase => {
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
      testCase.confirmedNoDistantKindred ?? false,
    );

    for (const [heirId, expected] of Object.entries(testCase.expected)) {
      const actual = resultFor(results, heirId);
      expect(actual.shareFraction.toFraction()).toBe(expected.fraction);
      expect(actual.amount).toBe(expected.amount);
      expect(actual.isBlocked).toBe(false);
    }

    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(testCase.estate);
    if (testCase.calculationType) {
      expect(results.some(result => result.calculationType === testCase.calculationType)).toBe(true);
    }
  });

  it('withholds a spouse residue under Article 167 until absence of distant kindred is confirmed', () => {
    const results = calculateInheritance(
      [present('wife')],
      240_000,
      0,
      0,
      0,
      false,
      [],
      'stillborn',
      false,
      false,
    );

    const wife = resultFor(results, 'wife');
    const review = resultFor(results, 'article_180_review');
    expect(wife.shareFraction.toFraction()).toBe('1/4');
    expect(wife.amount).toBe(60_000);
    expect(review.article).toBe(167);
    expect(review.reason).toContain('لا يُرد باقي التركة');
  });

  it('splits a plural brother group per head in the Article 158 muqasama example', () => {
    const results = calculateInheritance(
      [present('grandfather'), present('full_brother', 2)],
      300_000, 0, 0, 0,
    );
    const brothers = resultFor(results, 'full_brother');

    expect(brothers.amount).toBe(200_000);
    expect(brothers.individuals).toHaveLength(2);
    expect(brothers.individuals?.map(person => person.amount)).toEqual([100_000, 100_000]);
  });
});

describe('Articles 175–176 — special cases through the production orchestrator', () => {
  it.each(statutoryCases.filter(testCase => testCase.article === 175 || testCase.article === 176))(
    '$id — preserves the statutory result without an unrelated manual-review hold',
    testCase => {
      const stage: MunasakhatStage = {
        id: `production-${testCase.id}`,
        deceasedName: 'مسألة خاصة مرجعية',
        hasMandatoryBequest: false,
        confirmedSpouseEligibility: true,
        confirmedNoDistantKindred: testCase.confirmedNoDistantKindred,
        heirs: testCase.heirs,
      };

      const [stageResult] = runInheritanceOrchestration([[
        stage,
      ], testCase.estate, 0, 0, 0]);

      expect(stageResult.requiresManualClassification).not.toBe(true);
      expect(stageResult.spouseEligibilityNeedsReview).not.toBe(true);
      expect(stageResult.financialInputNeedsManualReview).not.toBe(true);

      for (const [heirId, expected] of Object.entries(testCase.expected)) {
        const actual = resultFor(stageResult.results, heirId);
        expect(actual.shareFraction.toFraction(), heirId).toBe(expected.fraction);
        expect(actual.amount, heirId).toBe(expected.amount);
      }

      expect(
        stageResult.results.reduce((sum, result) => sum + result.amount, 0),
        testCase.id,
      ).toBe(testCase.estate);
    },
  );
});

describe('Legally guarded cases — a review result is not a computed distribution', () => {
  it('keeps spouse-only remainder unallocated before Article 167 conditions are confirmed', () => {
    const results = calculateInheritance([present('husband')], 240_000, 0, 0, 0);
    const husband = resultFor(results, 'husband');
    const review = resultFor(results, 'article_180_review');

    expect(husband.amount).toBe(120_000);
    expect(review.amount).toBe(0);
    expect(results.some(result => result.heirId === 'treasury')).toBe(false);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120_000);
  });

  it('returns a spouse-only remainder only after the Article 167/Dhu al-Arham confirmation', () => {
    const results = calculateInheritance(
      [present('husband')],
      240_000, 0, 0, 0,
      false, [], 'stillborn', false, true,
    );

    expect(resultFor(results, 'husband').amount).toBe(240_000);
    expect(results.some(result => result.heirId === 'article_180_review')).toBe(false);
  });

  it('does not calculate an automatic tanzil result in the production orchestration from aggregate grandchild counts', () => {
    const stages: MunasakhatStage[] = [{
      id: 'tanzil-review',
      deceasedName: 'المتوفى مع أحفاد',
      hasMandatoryBequest: true,
      deceasedSonsCount: 1,
      deceasedDaughtersCount: 0,
      deceasedChildren: [{ type: 'son', count: 1, priorGiftOrBequestAmount: 0 }],
      heirs: [],
    }];

    const [stage] = runInheritanceOrchestration([stages, 900_000, 0, 0, 0]);
    expect(stage.tanzilNeedsManualReview).toBe(true);
    expect(stage.results).toEqual([]);
  });

  it('holds a generic Dhu al-Arham entry for relationship-degree classification under Article 168', () => {
    const stages: MunasakhatStage[] = [{
      id: 'dhu-al-arham-review',
      deceasedName: 'المتوفى وذو رحم غير مصنف',
      hasMandatoryBequest: false,
      heirs: [present('maternal_grandfather')],
    }];

    const [stage] = runInheritanceOrchestration([stages, 100_000, 0, 0, 0]);
    expect(stage.requiresManualClassification).toBe(true);
    expect(stage.results).toEqual([]);
    expect(stage.excludedHeirWarnings?.some(warning => warning.heirId === 'maternal_grandfather')).toBe(true);
  });

  it('does not produce distributable heirs while the pregnancy outcome is pending', () => {
    const stages: MunasakhatStage[] = [{
      id: 'pending-pregnancy',
      deceasedName: 'المتوفى مع حمل قائم',
      hasMandatoryBequest: false,
      hasUnbornHeir: true,
      unbornOutcome: 'pending',
      confirmedSpouseEligibility: true,
      heirs: [present('wife'), present('daughter')],
    }];

    const [stage] = runInheritanceOrchestration([stages, 1_200_000, 0, 0, 0]);
    expect(stage.pregnancyNeedsManualReview).toBe(true);
    expect(stage.results).toEqual([]);
  });
});

describe('Tanzil engine arithmetic — separate from production eligibility review', () => {
  it('enforces the one-third tanzil ceiling where one surviving son blocks the predeceased son descendants from direct inheritance', () => {
    // The predeceased son's hypothetical portion is 1/2 of 900,000 = 450,000.
    // Article 170 caps the tanzil at one-third = 300,000; the surviving son
    // receives the remaining 600,000 as the ordinary heir.
    const results = calculateInheritance(
      [present('son')],
      900_000, 0, 0, 0,
      true,
      [{ type: 'son', count: 1 }],
      'stillborn',
      false,
      true,
    );

    expect(resultFor(results, 'mandatory_bequest').amount).toBe(300_000);
    expect(resultFor(results, 'son').amount).toBe(600_000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(900_000);
  });

  it('applies the one-third cap and prior gift/inheritance offsets before ordinary heirs receive the residue', () => {
    // Independent arithmetic:
    // Three hypothetical sons (two alive + one predeceased) give the deceased
    // son 1/3 of 600,000 = 200,000. Under Arts.171/172, 50,000 gift/bequest
    // plus 50,000 already inherited leaves 100,000 tanzil.
    // The two living sons divide the remaining 500,000 equally.
    const results = calculateInheritance(
      [present('son', 2)],
      600_000, 0, 0, 0,
      true,
      [{
        type: 'son',
        count: 1,
        priorGiftOrBequestAmount: 50_000,
        alreadyInheritedFromParentAmount: 50_000,
      }],
    );

    expect(resultFor(results, 'mandatory_bequest').amount).toBe(100_000);
    expect(resultFor(results, 'son').amount).toBe(500_000);
    expect(resultFor(results, 'son').individuals?.map(person => person.amount)).toEqual([250_000, 250_000]);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(600_000);
  });
});

describe('Pregnancy outcomes after a live birth or stillbirth — Articles 134 and 173', () => {
  it('adds a live-born male fetus as a son and recalculates the prescribed shares', () => {
    const results = calculateInheritance(
      [present('wife'), present('mother'), present('father')],
      240_000, 0, 0, 0,
      false, [], 'born_male', true,
    );

    expect(resultFor(results, 'wife').amount).toBe(30_000);
    expect(resultFor(results, 'mother').amount).toBe(40_000);
    expect(resultFor(results, 'father').amount).toBe(40_000);
    expect(resultFor(results, 'son').amount).toBe(130_000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(240_000);
  });

  it('adds a live-born female fetus as a daughter and corrects the father residue', () => {
    const results = calculateInheritance(
      [present('wife'), present('mother'), present('father')],
      240_000, 0, 0, 0,
      false, [], 'born_female', true,
    );

    expect(resultFor(results, 'wife').amount).toBe(30_000);
    expect(resultFor(results, 'mother').amount).toBe(40_000);
    expect(resultFor(results, 'father').amount).toBe(50_000);
    expect(resultFor(results, 'daughter').amount).toBe(120_000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(240_000);
  });

  it('does not create a fetus heir after a stillbirth', () => {
    const results = calculateInheritance(
      [present('wife'), present('mother'), present('father')],
      240_000, 0, 0, 0,
      false, [], 'stillborn', true,
    );

    expect(results.some(result => result.heirId === 'son' || result.heirId === 'daughter')).toBe(false);
    expect(resultFor(results, 'wife').amount).toBe(60_000);
    expect(resultFor(results, 'mother').amount).toBe(60_000);
    expect(resultFor(results, 'father').amount).toBe(120_000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(240_000);
  });
});

describe('Internal pregnancy-reserve accounting — not enabled for production distribution', () => {
  it('keeps the reserved greater child share separate from the residual heir distribution', () => {
    // Reference arithmetic for a controlled test scenario:
    // - Estate after debts/funeral: 1,200,000.
    // - Wife + one daughter; compare the unborn as one son vs one daughter.
    // - Son scenario: fetus share = 7/12 (700,000).
    // - Daughter scenario gives a smaller individual share (7/16).
    // - The helper therefore reserves 700,000 and distributes only the
    //   remaining 500,000 among the currently recorded heirs.
    //
    // The public calculateInheritance API deliberately returns a review state
    // while pregnancy is pending. This test protects the dormant internal
    // helper from corrupting amounts if a future, legally reviewed workflow
    // chooses to expose automatic Article 173 withholding.
    const results = calculateInheritanceInternal(
      [present('wife'), present('daughter')],
      1_200_000,
      0,
      0,
      0,
      false,
      [],
      'pending',
      true,
    );

    const withheld = resultFor(results, 'unborn_withholding');
    const wife = resultFor(results, 'wife');
    const daughter = resultFor(results, 'daughter');

    expect(withheld.amount).toBe(700_000);
    expect(withheld.shareFraction.toFraction()).toBe('7/12');
    expect(withheld.problemBase).toBe(0);
    expect(withheld.shares).toBe(0);
    expect(wife.amount + daughter.amount).toBe(500_000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(1_200_000);
  });
});

describe('Munasakhat stage hand-off reference', () => {
  it('uses inheritedFromParentAmount plus ownSeparateAssets as the secondary deceased estate', () => {
    const stages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المورث الأول',
        hasMandatoryBequest: false,
        confirmedSpouseEligibility: true,
        heirs: [present('wife'), present('son')],
      },
      {
        id: 'child-death',
        deceasedName: 'الابن المتوفى لاحقاً',
        parentHeirId: 'son',
        parentStageId: 'root',
        parentHeirCount: 1,
        hasMandatoryBequest: false,
        confirmedSpouseEligibility: true,
        inheritedFromParentAmount: 105_000,
        ownSeparateAssets: 15_000,
        heirs: [present('wife'), present('son')],
      },
    ];

    const results = runInheritanceOrchestration([stages, 120_000, 0, 0, 0]);
    expect(results).toHaveLength(2);
    expect(results[0].netEstate).toBe(120_000);
    expect(results[1].netEstate).toBe(120_000);
    expect(resultFor(results[0].results, 'wife').amount).toBe(15_000);
    expect(resultFor(results[0].results, 'son').amount).toBe(105_000);
    expect(resultFor(results[1].results, 'wife').amount).toBe(15_000);
    expect(resultFor(results[1].results, 'son').amount).toBe(105_000);
  });
});
