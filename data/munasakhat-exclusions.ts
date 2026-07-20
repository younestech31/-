// خريطة استبعاد الورثة في المسائل الثانوية (المناسخات)
// المفتاح (key) هو نوع الوارث المتوفى (parentHeirId)
// القيمة (value) هي قائمة الورثة المستحيلين أو المشتركين مع المسألة الأصلية
const MUNASAKHAT_EXCLUSIONS: Record<string, string[]> = {
  // فرع نازل (الابن، البنت، ابن الابن، بنت الابن)
  'son': ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
  'daughter': ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
  'son_son': ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],
  'granddaughter': ['father', 'grandfather', 'paternal_grandmother', 'mother', 'maternal_grandmother', 'full_brother', 'paternal_brother', 'full_sister', 'paternal_sister'],

  // حواشي (الأخ الشقيق، الأخت الشقيقة)
  'full_brother': ['father', 'mother', 'grandfather', 'maternal_grandmother', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_grandfather'],
  'full_sister': ['father', 'mother', 'grandfather', 'maternal_grandmother', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_grandfather'],

  // حواشي (الأخ لأب، الأخت لأب)
  'paternal_brother': ['father', 'mother', 'grandfather', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'],
  'paternal_sister': ['father', 'mother', 'grandfather', 'paternal_grandmother', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'],

  // حواشي (الإخوة لأم)
  'maternal_siblings': ['mother', 'maternal_grandmother', 'maternal_siblings', 'maternal_grandfather'],

  // أصول (الأب)
  // نستبعد الفرع النازل والأب نفسه لأن ورثة الأب في حالة وفاته كمسألة فرعية هم أبناؤه الحقيقيون (إخوة المتوفى في المسألة الأصلية والأب نفسه لا يرث نفسه)
  'father': ['father', 'son', 'daughter', 'son_son', 'granddaughter'],
  
  // أصول (الأم)
  // نستبعد أبناءها لنفس السبب: هم في الحقيقة إخوة المتوفى الأصلي ولا يرثونها هنا بصفة "ابن"
  'mother': ['mother', 'son', 'daughter', 'son_son', 'granddaughter'],
  
  // الزوجين
  // الزوج لا يرث زوجته (لأن كلاهما متوفى)، ولا يمكن أن يخلف أحدهما الآخر كمتوفى وارث في نفس الوقت
  'husband': ['husband', 'wife'],
  'wife': ['wife', 'husband']
};

export const isHeirExcludedInMunasakhat = (
  heirId: string,
  parentHeirId: string
): { excluded: boolean; reason: string } => {
  const excludedList = MUNASAKHAT_EXCLUSIONS[parentHeirId] || [];
  
  if (excludedList.includes(heirId)) {
    let reason = 'مستبعد: وارث مشترك مع المسألة الأم أو مستحيل عقلاً';
    
    if (['father', 'mother', 'grandfather', 'paternal_grandmother', 'maternal_grandmother', 'maternal_grandfather'].includes(heirId)) {
      reason = 'مستبعد: الأصول مشتركة مع المسألة الأم';
    } else if (['full_brother', 'full_sister', 'paternal_brother', 'paternal_sister'].includes(heirId)) {
      reason = 'مستبعد: الإخوة/الأخوات هم ورثة في الأساس (كأعمام أو غيرهم)';
    } else if (['son', 'daughter', 'son_son', 'granddaughter'].includes(heirId) && ['father', 'mother'].includes(parentHeirId)) {
      reason = 'مستبعد: الفرع النازل هو المتوفى الأصلي';
    } else if (['husband', 'wife'].includes(heirId) && ['husband', 'wife'].includes(parentHeirId)) {
       reason = 'مستبعد: استنتاج غير منطقي (لا يمكن أن يرث الزوج زوجته المتوفاة بعده)';
    }

    return { excluded: true, reason };
  }

  return { excluded: false, reason: '' };
};
