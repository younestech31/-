// data/blocking-rules.ts

export interface BlockingRule {
  blocker: string;  // الحاجب
  blocked: string;  // المحجوب
  type: 'full' | 'partial'; // حجب إسقاط أو نقصان
  article: number;
  conditionAr: string;
}

export const BLOCKING_RULES: BlockingRule[] = [
  // حجب الإسقاط (م. 161-165)
  {
    blocker: 'mother',
    blocked: 'maternal_grandmother',
    type: 'full',
    article: 161,
    conditionAr: 'الأم تحجب الجدة لأم'
  },
  {
    blocker: 'mother',
    blocked: 'paternal_grandmother',
    type: 'full',
    article: 161,
    conditionAr: 'الأم تحجب الجدة لأب'
  },
  {
    blocker: 'father',
    blocked: 'paternal_grandmother',
    type: 'full',
    article: 161,
    conditionAr: 'الأب يحجب الجدة لأب'
  },
  {
    blocker: 'grandfather',
    blocked: 'paternal_grandmother',
    type: 'full',
    article: 161,
    conditionAr: 'الجد يحجب الجدة من جهته (أم الأب)'
  },
  {
    blocker: 'father',
    blocked: 'grandfather',
    type: 'full',
    article: 162,
    conditionAr: 'الأب يحجب الجد الصحيح وإن علا'
  },
  {
    blocker: 'son',
    blocked: 'full_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'الابن يحجب ابن الأخ الشقيق'
  },
  {
    blocker: 'son',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'الابن يحجب ابن الأخ لأب'
  },
  {
    blocker: 'son_son',
    blocked: 'full_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'ابن الابن يحجب ابن الأخ الشقيق'
  },
  {
    blocker: 'son_son',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'ابن الابن يحجب ابن الأخ لأب'
  },
  {
    blocker: 'father',
    blocked: 'full_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'الأب يحجب ابن الأخ الشقيق'
  },
  {
    blocker: 'father',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 162,
    conditionAr: 'الأب يحجب ابن الأخ لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'full_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب أبناء الإخوة'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'full_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب ابن الأخ الشقيق'
  },
  {
    blocker: 'grandfather',
    blocked: 'full_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب ابن الأخ الشقيق'
  },
  {
    blocker: 'grandfather',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب ابن الأخ لأب'
  },
  {
    blocker: 'grandfather',
    blocked: 'full_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب العم الشقيق'
  },
  {
    blocker: 'grandfather',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب العم لأب'
  },
  {
    blocker: 'grandfather',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب ابن العم الشقيق'
  },
  {
    blocker: 'grandfather',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الجد الصحيح يحجب ابن العم لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب ابن الأخ لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'full_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب العم الشقيق'
  },
  {
    blocker: 'full_brother',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب العم لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب ابن العم الشقيق'
  },
  {
    blocker: 'full_brother',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ الشقيق يحجب ابن العم لأب'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب ابن الأخ لأب'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'full_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب العم الشقيق'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب العم لأب'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب ابن العم الشقيق'
  },
  {
    blocker: 'paternal_brother',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'الأخ لأب يحجب ابن العم لأب'
  },
  {
    blocker: 'full_nephew',
    blocked: 'paternal_nephew',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ الشقيق يحجب ابن الأخ لأب'
  },
  {
    blocker: 'full_nephew',
    blocked: 'full_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ الشقيق يحجب العم الشقيق'
  },
  {
    blocker: 'full_nephew',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ الشقيق يحجب العم لأب'
  },
  {
    blocker: 'full_nephew',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ الشقيق يحجب ابن العم الشقيق'
  },
  {
    blocker: 'full_nephew',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ الشقيق يحجب ابن العم لأب'
  },
  {
    blocker: 'paternal_nephew',
    blocked: 'full_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ لأب يحجب العم الشقيق'
  },
  {
    blocker: 'paternal_nephew',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ لأب يحجب العم لأب'
  },
  {
    blocker: 'paternal_nephew',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ لأب يحجب ابن العم الشقيق'
  },
  {
    blocker: 'paternal_nephew',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'ابن الأخ لأب يحجب ابن العم لأب'
  },
  {
    blocker: 'full_uncle',
    blocked: 'paternal_uncle',
    type: 'full',
    article: 165,
    conditionAr: 'العم الشقيق يحجب العم لأب'
  },
  {
    blocker: 'full_uncle',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'العم الشقيق يحجب ابن العم الشقيق'
  },
  {
    blocker: 'full_uncle',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'العم الشقيق يحجب ابن العم لأب'
  },
  {
    blocker: 'paternal_uncle',
    blocked: 'full_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'العم لأب يحجب ابن العم الشقيق'
  },
  {
    blocker: 'paternal_uncle',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'العم لأب يحجب ابن العم لأب'
  },
  {
    blocker: 'full_uncle_son',
    blocked: 'paternal_uncle_son',
    type: 'full',
    article: 165,
    conditionAr: 'ابن العم الشقيق يحجب ابن العم لأب'
  },
  /**
   * The input model uses one generic ID for sons' daughters of all degrees.
   * Degree-dependent cases are therefore held for manual review by the stage
   * orchestrator under Arts. 155 and 163; this rule table cannot infer lineage.
   */
  {
    blocker: 'son_son',
    blocked: 'granddaughter',
    type: 'full',
    article: 163,
    conditionAr: 'ابن الابن يحجب بنت الابن التي تكون أنزل منه درجة'
  },
  {
    blocker: 'two_daughters',
    blocked: 'granddaughter',
    type: 'full',
    article: 163,
    conditionAr: 'البنتان أو بنات الابن الأعلى درجة تحجب بنت الابن الأدنى ما لم يوجد من يعصبها — م.163'
  },
  {
    blocker: 'son',
    blocked: 'son_son',
    type: 'full',
    article: 163,
    conditionAr: 'الابن يحجب ابن الابن'
  },
  {
    blocker: 'son',
    blocked: 'granddaughter',
    type: 'full',
    article: 163,
    conditionAr: 'الابن يحجب بنت الابن'
  },
  {
    blocker: 'father',
    blocked: 'full_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الأب يحجب الأخت الشقيقة'
  },
  {
    blocker: 'son',
    blocked: 'full_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الابن يحجب الأخت الشقيقة'
  },
  {
    blocker: 'son_son',
    blocked: 'full_sister',
    type: 'full',
    article: 164,
    conditionAr: 'ابن الابن يحجب الأخت الشقيقة'
  },
  // Full Brother blocks
  {
    blocker: 'father',
    blocked: 'full_brother',
    type: 'full',
    article: 164,
    conditionAr: 'الأب يحجب الأخ الشقيق'
  },
  {
    blocker: 'son',
    blocked: 'full_brother',
    type: 'full',
    article: 164,
    conditionAr: 'الابن يحجب الأخ الشقيق'
  },
  {
    blocker: 'son_son',
    blocked: 'full_brother',
    type: 'full',
    article: 164,
    conditionAr: 'ابن الابن يحجب الأخ الشقيق'
  },
  // Paternal Brother/Sister blocks by father, son, son_son
  {
    blocker: 'father',
    blocked: 'paternal_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الأب يحجب الأخت لأب'
  },
  {
    blocker: 'son',
    blocked: 'paternal_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الابن يحجب الأخت لأب'
  },
  {
    blocker: 'son_son',
    blocked: 'paternal_sister',
    type: 'full',
    article: 164,
    conditionAr: 'ابن الابن يحجب الأخت لأب'
  },
  {
    blocker: 'father',
    blocked: 'paternal_brother',
    type: 'full',
    article: 164,
    conditionAr: 'الأب يحجب الأخ لأب'
  },
  {
    blocker: 'son',
    blocked: 'paternal_brother',
    type: 'full',
    article: 164,
    conditionAr: 'الابن يحجب الأخ لأب'
  },
  {
    blocker: 'son_son',
    blocked: 'paternal_brother',
    type: 'full',
    article: 164,
    conditionAr: 'ابن الابن يحجب الأخ لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'paternal_brother',
    type: 'full',
    article: 164,
    conditionAr: 'الأخ الشقيق يحجب الأخ لأب'
  },
  {
    blocker: 'full_brother',
    blocked: 'paternal_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الأخ الشقيق يحجب الأخت لأب'
  },
  {
    blocker: 'two_full_sisters_fard',
    blocked: 'paternal_sister',
    type: 'full',
    article: 164,
    conditionAr: 'الأختان الشقيقتان إذا استكملتا الثلثين (فرضاً) تحجبان الأخت لأب'
  },
  // Maternal Siblings blocks
  {
    blocker: 'father',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'الأب يحجب أولاد الأم'
  },
  {
    blocker: 'grandfather',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'الجد يحجب أولاد الأم'
  },
  {
    blocker: 'son',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'الابن يحجب أولاد الأم'
  },
  {
    blocker: 'daughter',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'البنت تحجب أولاد الأم'
  },
  {
    blocker: 'son_son',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'ابن الابن يحجب أولاد الأم'
  },
  {
    blocker: 'granddaughter',
    blocked: 'maternal_siblings',
    type: 'full',
    article: 148,
    conditionAr: 'بنت الابن تحجب أولاد الأم'
  },
  // حجب النقصان (م. 160)
  {
    blocker: 'direct_heir',
    blocked: 'husband',
    type: 'partial',
    article: 160,
    conditionAr: 'وجود الفرع الوارث ينقل الزوج من النصف إلى الربع'
  },
  {
    blocker: 'direct_heir',
    blocked: 'wife',
    type: 'partial',
    article: 160,
    conditionAr: 'وجود الفرع الوارث ينقل الزوجة من الربع إلى الثمن'
  },
  {
    blocker: 'direct_heir_or_siblings',
    blocked: 'mother',
    type: 'partial',
    article: 160,
    conditionAr: 'وجود فرع وارث أو عدد من الإخوة ينقل الأم من الثلث إلى السدس'
  },
];
