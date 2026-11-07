import type { DeceasedChildGroup, HeirPresence } from './inheritance-calculator';

export interface FinancialInputValidation {
  estate: number;
  inheritedAmount?: number;
  ownSeparateAssets?: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  heirs: HeirPresence[];
  deceasedSonsCount?: number;
  deceasedDaughtersCount?: number;
  deceasedChildren?: DeceasedChildGroup[];
}

/**
 * Validate the numeric inputs that can change the estate or a heir's
 * calculated entitlement. This validator runs at the shared orchestration
 * boundary, so the synchronous UI and Web Worker cannot disagree.
 *
 * Voluntary bequests above the available legal third are intentionally not
 * rejected here: the calculation engine applies the statutory cap.
 */
export function validateFinancialInputs(input: FinancialInputValidation): string[] {
  const issues: string[] = [];

  const amounts: Array<[string, number]> = [
    ['صافي قيمة التركة المدخلة', input.estate],
    ['المبلغ الموروث من المرحلة السابقة', input.inheritedAmount ?? 0],
    ['الأموال الخاصة الإضافية', input.ownSeparateAssets ?? 0],
    ['الديون', input.debts],
    ['مصاريف التجهيز والدفن', input.funeralCosts],
    ['الوصية الاختيارية', input.bequest],
  ];

  for (const [label, value] of amounts) {
    if (!Number.isFinite(value)) {
      issues.push(`قيمة «${label}» غير رقمية أو خارج النطاق الحسابي.`);
    } else if (value < 0) {
      issues.push(`قيمة «${label}» لا يمكن أن تكون سالبة.`);
    }
  }

  const financialValuesAreValid = amounts.every(([, value]) =>
    Number.isFinite(value) && value >= 0
  );

  if (
    financialValuesAreValid &&
    input.debts + input.funeralCosts > input.estate
  ) {
    issues.push('مجموع الديون ومصاريف التجهيز والدفن يتجاوز قيمة التركة المدخلة؛ أوقف الحساب حتى تصحيح المبالغ.');
  }

  const seenHeirIds = new Set<string>();
  for (const heir of input.heirs) {
    if (typeof heir.heirId !== 'string' || heir.heirId.trim().length === 0) {
      issues.push('يوجد وارث بلا معرّف صالح؛ لا يمكن ربط نصيبه بنتيجة حسابية موثوقة.');
    } else if (seenHeirIds.has(heir.heirId)) {
      issues.push(`تكرر معرّف الوارث «${heir.heirId}» في بيانات المرحلة؛ يجب دمج المجموعة قبل الحساب.`);
    } else {
      seenHeirIds.add(heir.heirId);
    }

    if (!Number.isSafeInteger(heir.count) || heir.count < 0) {
      issues.push(`عدد أفراد فئة «${heir.heirId || 'وارث غير محدد'}» يجب أن يكون عدداً صحيحاً غير سالب.`);
    }

    if (
      heir.motherReductionCount !== undefined &&
      (!Number.isSafeInteger(heir.motherReductionCount) || heir.motherReductionCount < 0)
    ) {
      issues.push(`عدد الإخوة المحتسب لتخفيض فرض الأم في فئة «${heir.heirId}» غير صالح.`);
    }
  }

  const deceasedCounts: Array<[string, number]> = [
    ['الأبناء المتوفون', input.deceasedSonsCount ?? 0],
    ['البنات المتوفيات', input.deceasedDaughtersCount ?? 0],
  ];
  for (const [label, count] of deceasedCounts) {
    if (!Number.isSafeInteger(count) || count < 0) {
      issues.push(`عدد «${label}» يجب أن يكون عدداً صحيحاً غير سالب.`);
    }
  }

  for (const group of input.deceasedChildren ?? []) {
    if (!Number.isSafeInteger(group.count) || group.count < 0) {
      issues.push(`عدد فرع «${group.type}» المتوفى في بيانات التنزيل غير صالح.`);
    }
    for (const [label, amount] of [
      ['الهبة أو الوصية السابقة', group.priorGiftOrBequestAmount],
      ['الميراث السابق من الأصل', group.alreadyInheritedFromParentAmount],
    ] as const) {
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
        issues.push(`قيمة «${label}» في فرع «${group.type}» يجب أن تكون رقماً غير سالب.`);
      }
    }
  }

  return [...new Set(issues)];
}
