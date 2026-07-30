// خريطة وسجل استبعاد الورثة في المسائل الثانوية (المناسخات)
// يتضمن كل قانون استبعاد مرجعاً شرعياً أو نصاً من قانون الأسرة الجزائري أو سابقة توثيقية

export interface MunasakhatExclusionRule {
  parentHeirId: string;
  excludedHeirIds: string[];
  reason: string;
  source: string; // مرجع فقهي أو قانوني إجباري
}

export const MUNASAKHAT_EXCLUSION_RULES: MunasakhatExclusionRule[] = [
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
    source: 'المادة 144 و 153 من قانون الأسرة الجزائري والسابقة التوثيقية رقم 402/2018',
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

export const isHeirExcludedInMunasakhat = (
  heirId: string,
  parentHeirId: string,
  secondDeceasedHasChildrenFromOtherUnion: boolean = false
): { excluded: boolean; reason: string; source: string } => {
  if (
    secondDeceasedHasChildrenFromOtherUnion &&
    ['father', 'mother'].includes(parentHeirId) &&
    ['son', 'daughter', 'son_son', 'granddaughter'].includes(heirId)
  ) {
    return { excluded: false, reason: '', source: '' };
  }

  const rule = MUNASAKHAT_EXCLUSION_RULES.find(r => r.parentHeirId === parentHeirId);
  
  if (rule && rule.excludedHeirIds.includes(heirId)) {
    let reason = rule.reason;
    
    if (['father', 'mother', 'grandfather', 'paternal_grandmother', 'maternal_grandmother', 'maternal_grandfather'].includes(heirId)) {
      reason = 'مستبعد: الأصول مشتركة مع المسألة الأم';
    } else if (['full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'].includes(heirId)) {
      reason = 'مستبعد: الإخوة/الأخوات هم ورثة في الأساس (كأعمام أو غيرهم)';
    } else if (['son', 'daughter', 'son_son', 'granddaughter'].includes(heirId) && ['father', 'mother'].includes(parentHeirId)) {
      reason = 'مستبعد: الفرع النازل هو المتوفى الأصلي';
    } else if (['husband', 'wife'].includes(heirId) && ['husband', 'wife'].includes(parentHeirId)) {
      reason = 'مستبعد: استنتاج غير منطقي (لا يمكن أن يرث الزوج زوجته المتوفاة بعده)';
    }

    return {
      excluded: true,
      reason,
      source: rule.source,
    };
  }

  return { excluded: false, reason: '', source: '' };
};
