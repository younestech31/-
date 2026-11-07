import { describe, expect, it } from 'vitest';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import { WorkerInputSchema } from '@/workers/schema';
import type { HeirPresence } from '@/lib/inheritance/inheritance-calculator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

const present = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

function stage(
  id: string,
  overrides: Partial<MunasakhatStage> = {},
): MunasakhatStage {
  const son = present('son');
  return {
    id,
    estate: 1_000,
    hasMandatoryBequest: false,
    deceasedSonsCount: 0,
    deceasedDaughtersCount: 0,
    heirs: [son],
    heirPresence: { son },
    ...overrides,
  };
}

function calculate(
  stages: MunasakhatStage[],
  estate = 1_000,
  debts = 0,
  funeralCosts = 0,
  bequest = 0,
) {
  return runInheritanceOrchestration([stages, estate, debts, funeralCosts, bequest]);
}

describe('Shared financial input validation at the inheritance orchestration boundary', () => {
  it('keeps a valid ordinary inheritance calculation unchanged', () => {
    const [result] = calculate([stage('root')]);

    expect(result.financialInputNeedsManualReview).toBeUndefined();
    expect(result.results.find(row => row.heirId === 'son')?.amount).toBe(1_000);
    expect(result.results.reduce((sum, row) => sum + row.amount, 0)).toBe(1_000);
  });

  it.each([
    ['negative estate', -1, 0, 0, 0, 'قيمة «صافي قيمة التركة المدخلة» لا يمكن أن تكون سالبة.'],
    ['negative debt', 1_000, -1, 0, 0, 'قيمة «الديون» لا يمكن أن تكون سالبة.'],
    ['negative funeral costs', 1_000, 0, -1, 0, 'قيمة «مصاريف التجهيز والدفن» لا يمكن أن تكون سالبة.'],
    ['negative bequest', 1_000, 0, 0, -1, 'قيمة «الوصية الاختيارية» لا يمكن أن تكون سالبة.'],
    ['deductions exceed the estate', 1_000, 700, 400, 0, 'مجموع الديون ومصاريف التجهيز والدفن يتجاوز قيمة التركة المدخلة؛ أوقف الحساب حتى تصحيح المبالغ.'],
  ] as const)('holds the result for %s', (_label, estate, debts, funeralCosts, bequest, expectedIssue) => {
    const [result] = calculate([stage('root')], estate, debts, funeralCosts, bequest);

    expect(result.results).toEqual([]);
    expect(result.netEstate).toBe(0);
    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors).toContain(expectedIssue);
  });

  it('holds a calculation when an heir count is fractional or negative', () => {
    const [fractional] = calculate([
      stage('fractional', { heirs: [present('son', 1.5)] }),
    ]);
    const [negative] = calculate([
      stage('negative', { heirs: [present('son', -1)] }),
    ]);

    expect(fractional.financialInputNeedsManualReview).toBe(true);
    expect(fractional.financialInputErrors?.some(issue => issue.includes('عدد أفراد فئة'))).toBe(true);
    expect(negative.financialInputNeedsManualReview).toBe(true);
    expect(negative.results).toEqual([]);
  });

  it('holds a present heir category with a zero count', () => {
    const [result] = calculate([
      stage('zero-present', { heirs: [present('son', 0)] }),
    ]);

    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors?.some(issue => issue.includes('يجب أن يكون عدداً صحيحاً موجباً عند تفعيل وجودها'))).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('allows an inactive heir category to retain a zero count', () => {
    const son = { heirId: 'son', count: 0, isPresent: false };
    const [result] = calculate([
      stage('inactive-zero', {
        heirs: [present('daughter'), son],
      }),
    ]);

    expect(result.financialInputNeedsManualReview).toBeUndefined();
    expect(result.results.find(row => row.heirId === 'son')).toBeUndefined();
  });

  it('holds mutually incompatible husband and wife inputs for one deceased person', () => {
    const [result] = calculate([
      stage('two-spouses', {
        heirs: [present('son'), present('husband'), present('wife')],
      }),
    ]);

    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors).toContain(
      'لا يمكن تسجيل الزوج والزوجة معاً كورثة للمتوفى نفسه؛ راجع جنس المتوفى وصلة الزوجية قبل الحساب.'
    );
    expect(result.results).toEqual([]);
  });

  it('holds duplicate heir IDs instead of silently overwriting or duplicating a share', () => {
    const [result] = calculate([
      stage('duplicate', { heirs: [present('son'), present('son')] }),
    ]);

    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors?.some(issue => issue.includes('تكرر معرّف الوارث'))).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('validates the inherited amount and separate assets independently in a secondary stage', () => {
    const root = stage('root');
    const secondary = stage('secondary', {
      parentStageId: 'root',
      parentHeirId: 'son',
      inheritedFromParentAmount: 400,
      ownSeparateAssets: -25,
    });
    const results = calculate([root, secondary]);

    expect(results[0].financialInputNeedsManualReview).toBeUndefined();
    expect(results[1].financialInputNeedsManualReview).toBe(true);
    expect(results[1].financialInputErrors).toContain('قيمة «الأموال الخاصة الإضافية» لا يمكن أن تكون سالبة.');
    expect(results[1].results).toEqual([]);
  });

  it('does not calculate a secondary stage from a parent stage with invalid financial inputs', () => {
    const root = stage('root');
    const secondary = stage('secondary', {
      parentStageId: 'root',
      parentHeirId: 'son',
      inheritedFromParentAmount: 400,
      ownSeparateAssets: 0,
    });
    const results = calculate([root, secondary], 1_000, 1_100, 0, 0);

    expect(results[0].financialInputNeedsManualReview).toBe(true);
    expect(results[1].financialInputNeedsManualReview).toBe(true);
    expect(results[1].financialInputErrors?.some(issue => issue.includes('المرحلة الأصلية المرتبطة'))).toBe(true);
    expect(results[1].results).toEqual([]);
  });

  it('lets structurally valid negative worker data reach the shared domain validator', () => {
    const root = stage('root');
    const payload = {
      id: 77,
      args: [[root], 1_000, -1, 0, 0],
    };

    expect(WorkerInputSchema.safeParse(payload).success).toBe(true);

    const [result] = calculate([root], 1_000, -1, 0, 0);
    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('still applies the legal one-third cap to an oversized voluntary bequest', () => {
    const [result] = calculate([stage('root')], 1_000, 0, 0, 500);
    const voluntaryBequest = result.results.find(row => row.heirId === 'voluntary_bequest');

    expect(result.financialInputNeedsManualReview).toBeUndefined();
    expect(voluntaryBequest?.amount).toBeLessThanOrEqual((1_000 / 3) + 1e-9);
  });

  it('rejects amounts that cannot be represented safely as integer centimes', () => {
    const tooLargeForCentimes = (Number.MAX_SAFE_INTEGER / 100) + 100;
    const [result] = calculate([stage('root')], tooLargeForCentimes, 0, 0, 0);

    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors?.some(issue => issue.includes('تتجاوز الحد الآمن للحساب بالسنتيم'))).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('rejects non-finite numeric inputs before any share is calculated', () => {
    const [result] = calculate([stage('root')], Number.NaN, 0, 0, 0);

    expect(result.financialInputNeedsManualReview).toBe(true);
    expect(result.financialInputErrors?.some(issue => issue.includes('غير رقمية'))).toBe(true);
    expect(result.results).toEqual([]);
  });
});
