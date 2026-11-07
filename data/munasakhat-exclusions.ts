// قواعد مراجعة مبدئية لفئات القرابة في المسائل الثانوية (المناسخات).
// هذه القواعد مأخوذة من ملاحظات قديمة ولا تكفي وحدها لاستبعاد شخص بعينه؛
 // يجب التحقق من هوية الوارث وحياته وقرابته التفصيلية وقت وفاة كل مورث.

export interface MunasakhatExclusionRule {
  parentHeirId: string;
  /** Legacy category matches used only to raise a manual review prompt. */
  excludedHeirIds: string[];
  /** Legacy note explaining why this category should be reviewed, not excluded. */
  reason: string;
  /** Historical source note; not an executable legal authority. */
  source: string;
}

export const MUNASAKHAT_REVIEW_RULES: MunasakhatExclusionRule[] = [
  {
    parentHeirId: 'son',
    excludedHeirIds: ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
    reason: 'مستبعد: الأصول مشتركة مع المسألة الأم أو حجب بالفرع المباشر',
    source: 'الفقه المالكي — مختصر خليل باب المناسخات، والمادتان 150 و 177 من قانون الأسرة الجزائري (حجب الحواشي والأصول المؤصلة بالفرع النازل الذكر)',
  },
  {
    parentHeirId: 'daughter',
    excludedHeirIds: ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
    reason: 'مستبعد: الأصول مشتركة مع المسألة الأم أو مستحيل عقلاً',
    source: 'الفقه المالكي — الرسالة لابن أبي زيد القيرواني، والمواد 144 و 150 من قانون الأسرة الجزائري (قواعد استغراق الفروض وإعادة التصفية الجامعية)',
  },
  {
    parentHeirId: 'son_son',
    excludedHeirIds: ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
    reason: 'مستبعد: حجب بالفرع النازل الذكر والمحلية المشتركة',
    source: 'المادة 150 و 154 من قانون الأسرة الجزائري (حجب العصوبة بالإبناء وإن نزل)',
  },
  {
    parentHeirId: 'granddaughter',
    excludedHeirIds: ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
    reason: 'مستبعد: اتحاد الأصول في الجامعة السابقة',
    source: 'الفقه المالكي — التوضيح للشريشي باب الفرائض والمادتان 145 و 150 من قانون الأسرة',
  },
  {
    parentHeirId: 'full_brother',
    excludedHeirIds: ['father', 'mother', 'grandfather', 'maternal_grandmother', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_grandfather'],
    reason: 'مستبعد: الإخوة/الأخوات والأصول هم ورثة في الأساس بالجامعة الأصلية',
    source: 'المادة 151 و 153 من قانون الأسرة الجزائري وقواعد الفقه المالكي في مناسخة الإخوة',
  },
  {
    parentHeirId: 'full_sister',
    excludedHeirIds: ['father', 'mother', 'grandfather', 'maternal_grandmother', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_grandfather'],
    reason: 'مستبعد: اتحاد جهة الحواشي والأصول مع التركة الأولى',
    source: 'المادة 144 و 153 من قانون الأسرة الجزائري (قواعد استبعاد اتحاد الجهات والأصول)',
  },
  {
    parentHeirId: 'paternal_brother',
    excludedHeirIds: ['father', 'mother', 'grandfather', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'],
    reason: 'مستبعد: اتحاد جهة الأب في التركة الأصلية',
    source: 'المادة 153 من قانون الأسرة الجزائري (قواعد الترتيب في العصوبة بالأب)',
  },
  {
    parentHeirId: 'paternal_sister',
    excludedHeirIds: ['father', 'mother', 'grandfather', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'],
    reason: 'مستبعد: حجب واستبعاد باتحاد المورث في الجامعة',
    source: 'المادة 144 و 153 من قانون الأسرة الجزائري والفقه المالكي',
  },
  {
    parentHeirId: 'maternal_siblings',
    excludedHeirIds: ['mother', 'maternal_grandmother', 'maternal_siblings', 'maternal_grandfather'],
    reason: 'مستبعد: الإخوة لأم لا يرجعون بالأمومة على نفس الأصل كمتوفى فرعي',
    source: 'المادة 146 و 152 من قانون الأسرة الجزائري (فرض الإخوة لأم وعدم انحجابهم بإخوة آخرين)',
  },
  {
    parentHeirId: 'father',
    excludedHeirIds: ['father', 'son', 'daughter', 'son_son', 'granddaughter'],
    reason: 'مستبعد: الفرع النازل هو المتوفى الأصلي ولا يرث الأب نفسه',
    source: 'المادة 139 و 149 من قانون الأسرة الجزائري (شروط استحقاق الإرث وتحقق حياة الوارث)',
  },
  {
    parentHeirId: 'mother',
    excludedHeirIds: ['mother', 'son', 'daughter', 'son_son', 'granddaughter'],
    reason: 'مستبعد: الفرع النازل للمؤصلة هو المتوفى الأصلي في الجامعة',
    source: 'المادة 139 و 142 من قانون الأسرة الجزائري وقواعد استبعاد المورث المباشر',
  },
  {
    parentHeirId: 'husband',
    excludedHeirIds: ['husband', 'wife'],
    reason: 'مستبعد: استنتاج غير منطقي (انقطاع الرابطة الزوجية بالوفاة)',
    source: 'المادة 130 و 139 من قانون الأسرة الجزائري (انحلال عقد الزواج بالوفاة وعدم التوارث بين متوفيين متلاحقين بصفة الزوجية ذاتها)',
  },
  {
    parentHeirId: 'wife',
    excludedHeirIds: ['wife', 'husband'],
    reason: 'مستبعد: استنتاج غير منطقي (انقطاع الرابطة الزوجية بالوفاة)',
    source: 'المادة 130 و 139 من قانون الأسرة الجزائري (انحلال عقد الزواج بالوفاة والشرط التوثيقي المعمول به)',
  },
 ];

/** @deprecated Legacy name retained for saved integrations; entries are review prompts, not exclusion decisions. */
export const MUNASAKHAT_EXCLUSION_RULES = MUNASAKHAT_REVIEW_RULES;

export const isHeirExcludedInMunasakhat = (
  heirId: string,
  parentHeirId: string,
  secondDeceasedHasChildrenFromOtherUnion: boolean = false
): { excluded: boolean; requiresReview: boolean; reason: string; source: string } => {
  const rule = MUNASAKHAT_REVIEW_RULES.find(
    candidate => candidate.parentHeirId === parentHeirId
      && candidate.excludedHeirIds.includes(heirId)
  );

  if (!rule) {
    return { excluded: false, requiresReview: false, reason: '', source: '' };
  }

  const otherUnionContext = secondDeceasedHasChildrenFromOtherUnion
    ? ' ويوجد تصريح بوجود أبناء من اتحاد آخر؛ يجب التحقق من هوية كل ابن وصلته بالمتوفى.'
    : '';

  return {
    // Relationship categories alone never prove that a specific person is barred.
    excluded: false,
    requiresReview: true,
    reason: 'تتطلب هذه الصلة مراجعة فردية. تحقق من هوية الشخص، وحياته وقت وفاة صاحب هذه التركة، وصلته التفصيلية، وما إذا كان هو ذات الوارث المتوفى في مرحلة سابقة.' + otherUnionContext,
    source: 'ملاحظة مرجعية قديمة للمراجعة القانونية فقط — ليست قاعدة استبعاد آليًا: ' + rule.source,
  };
};
export function validateMunasakhatStageExclusions(
  stage: {
    deceasedHeirId?: string;
    parentHeirId?: string;
    acknowledgedExclusions?: string[];
    heirs?: { heirId: string; isPresent?: boolean; count?: number; isImpeded?: boolean }[];
    heirPresence?: Record<string, { heirId: string; isPresent?: boolean; count?: number; isImpeded?: boolean }>;
    deceasedSonsCount?: number;
    deceasedDaughtersCount?: number;
    deceasedChildren?: { type: 'son' | 'daughter'; count: number }[];
    hasMandatoryBequest?: boolean;
    hasChildrenFromOtherUnion?: boolean;
    secondDeceasedHasChildrenFromOtherUnion?: boolean;
  },
  _prevRes: unknown,
  stageIndex: number
) {
  const parentHeirId = stage.deceasedHeirId || stage.parentHeirId;
  const acknowledged = stage.acknowledgedExclusions || [];
  const presenceList = stage.heirs?.length ? stage.heirs : (stage.heirPresence ? Object.values(stage.heirPresence) : []);
  const presentIds = new Set(
    presenceList
      .filter(heir => heir.isPresent && Boolean(heir.count && heir.count > 0) && !heir.isImpeded)
      .map(heir => heir.heirId)
  );
  const hasOtherUnion = stage.secondDeceasedHasChildrenFromOtherUnion
    ?? stage.hasChildrenFromOtherUnion
    ?? false;
  const manualClassificationIds = new Set(['distant_kindred', 'maternal_grandfather']);
  const manualClassificationReasons: string[] = [];

  if (presentIds.has('distant_kindred') || presentIds.has('maternal_grandfather')) {
    manualClassificationReasons.push(
      'المادة 168: لا يكفي اختيار فئة عامة لذوي الأرحام أو الجد لأم؛ يلزم تحديد صلة كل قريب ودرجة القرابة وجهة الإدلاء وترتيب الاستحقاق.'
    );
  }

  const grandmotherDegreeNeedsManualReview = presenceList.some(heir =>
    heir.isPresent && heir.count > 1 &&
    ['maternal_grandmother', 'paternal_grandmother'].includes(heir.heirId)
  );
  if (grandmotherDegreeNeedsManualReview) {
    manualClassificationReasons.push(
      'المادتان 149(4) و161: تقسيم السدس أو اختصاص الجدة الأقرب به يتطلب معرفة درجة كل جدة. لا يميز النموذج الحالي الجدات الأبعد عن الجدة المباشرة، لذلك تُراجع هذه الصورة يدوياً.'
    );
  }

  const hasGrandfather = presentIds.has('grandfather');
  const hasFullSiblingLine = presentIds.has('full_brother') || presentIds.has('full_sister');
  const hasPaternalSiblingLine = presentIds.has('paternal_brother') || presentIds.has('paternal_sister');
  if (hasGrandfather && hasFullSiblingLine && hasPaternalSiblingLine) {
    manualClassificationReasons.push(
      'المادة 158 مع اجتماع الإخوة الأشقاء والإخوة لأب: هذه صورة المعاداة، وتحتاج معالجة مستقلة موثقة؛ لا يعتمد المحرك حالياً نتيجة آلية لها.'
    );
  }

  const hasGranddaughter = presentIds.has('granddaughter');
  const hasPotentialGranddaughterCousinAsaba = [
    'full_nephew', 'paternal_nephew', 'full_uncle_son', 'paternal_uncle_son',
  ].some(heirId => presentIds.has(heirId));
  if (hasGranddaughter && hasPotentialGranddaughterCousinAsaba) {
    manualClassificationReasons.push(
      'المادة 155: قد تصبح بنت الابن عصبة بغيرها مع قريب ذكر في درجتها أو ابن ابن عمها الأنزل درجة. لا يسجل النموذج درجة القريب وجهة الإدلاء، لذلك عُلّق الحساب الآلي حتى تراجع القرابة.'
    );
  }

  const deceasedSonsCount = stage.deceasedSonsCount
    ?? (stage.deceasedChildren?.filter(child => child.type === 'son').reduce((sum, child) => sum + child.count, 0) || 0);
  const deceasedDaughtersCount = stage.deceasedDaughtersCount
    ?? (stage.deceasedChildren?.filter(child => child.type === 'daughter').reduce((sum, child) => sum + child.count, 0) || 0);
  const tanzilNeedsManualReview = Boolean(
    stage.hasMandatoryBequest && deceasedSonsCount + deceasedDaughtersCount > 0
  );

  const unacknowledgedExclusions: { heirId: string; reason: string; source: string }[] = [];
  const acknowledgedExclusionsList: { heirId: string; reason: string; source: string }[] = [];

  presenceList.forEach((heir) => {
    if (!heir.isPresent || !heir.count || heir.count <= 0) return;

    const isManualKindred = manualClassificationIds.has(heir.heirId);
    const relationshipAssessment = stageIndex > 0 && parentHeirId && !isManualKindred
      ? isHeirExcludedInMunasakhat(heir.heirId, parentHeirId, hasOtherUnion)
      : null;
    if (!isManualKindred && !relationshipAssessment?.requiresReview) return;

    const item = isManualKindred
      ? {
          heirId: heir.heirId,
          reason: 'هذا المدخل لا يحدد صلة ذي الرحم ودرجة القرابة وجهة الإدلاء. تشترط المادة 168 ترتيب المستحقين وفق هذه التفاصيل؛ ولا ينفذ المحرك قسمة آلية لهذه الفئة العامة.',
          source: 'المادة 168 من قانون الأسرة — بوابة وزارة العدل: https://droit.mjustice.gov.dz/ar/content/قوانين-أساسية-2',
        }
      : {
          heirId: heir.heirId,
          reason: relationshipAssessment!.reason,
          source: relationshipAssessment!.source,
        };

    if (acknowledged.includes(heir.heirId)) {
      acknowledgedExclusionsList.push(item);
    } else {
      unacknowledgedExclusions.push(item);
    }
  });

  return {
    unacknowledgedExclusions,
    acknowledgedExclusions: acknowledgedExclusionsList,
    hasUnacknowledgedExclusions: unacknowledgedExclusions.length > 0,
    requiresManualClassification: manualClassificationReasons.length > 0,
    manualClassificationReasons,
    tanzilNeedsManualReview,
  };
}
