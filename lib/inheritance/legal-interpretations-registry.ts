// lib/inheritance/legal-interpretations-registry.ts

export interface LegalInterpretation {
  id: string;
  nameAr: string;
  familyCodeArticles: string[];
  fiqhSourceOrCircular: string;
  schoolOfThought: string;
  descriptionAr: string;
  defaultSetting: boolean;
  lastReviewedBy: string;
  lastReviewedDate: string;
  verifiedSource: boolean;
  sourceUrl?: string;
}

export const LEGAL_INTERPRETATIONS_REGISTRY: Record<string, LegalInterpretation> = {
  IMPEDED_SIBLINGS_REDUCTION: {
    id: 'IMPEDED_SIBLINGS_REDUCTION',
    nameAr: 'تأثير الإخوة المحجوبين في تخفيض حصة الأم',
    familyCodeArticles: ['المادة 148'],
    fiqhSourceOrCircular: 'الفقه المالكي وقواعد حجب النقصان للأم بتعدد الإخوة (المادة 148 من قانون الأسرة الجزائري)',
    schoolOfThought: 'المذهب المالكي والجمهور',
    descriptionAr: 'تؤثر كثرة الإخوة في فرض الأم ولو لم يرثوا، عملاً بعبارة المادة 148؛ ويحتفظ المحرك بعدد الإخوة الممنوعين من الإرث لهذا الشرط دون إدخالهم في قسمة التركة.',
    defaultSetting: true,
    lastReviewedBy: 'مطابقة مع العبارة الصريحة في المادة 148: «ولو لم يرثوا»',
    lastReviewedDate: '2026-11-07',
    verifiedSource: true,
  },
  AKDARIYYA_PATERNAL_SISTER: {
    id: 'AKDARIYYA_PATERNAL_SISTER',
    nameAr: 'المسألة الأكدرية مع الأخت الشقيقة أو الأخت لأب',
    familyCodeArticles: ['المادة 175'],
    fiqhSourceOrCircular: 'المادة 175 من قانون الأسرة الجزائري، التي تنص صراحة على الأخت الشقيقة أو لأب في الأكدرية.',
    schoolOfThought: 'قانون الأسرة الجزائري',
    descriptionAr: 'تطبيق حكم المسألة الأكدرية على الأخت الشقيقة أو الأخت لأب وفق التكوين المحدد حصراً في المادة 175.',
    defaultSetting: true,
    lastReviewedBy: 'مطابقة نص المادة 175؛ تشمل الشقيقة أو لأب صراحةً',
    lastReviewedDate: '2026-11-07',
    verifiedSource: true,
  },
  MUNASAKHAT_NO_HEIRS_TREASURY: {
    id: 'MUNASAKHAT_NO_HEIRS_TREASURY',
    nameAr: 'أيلولة التركة عند عدم وجود وارث إلى الخزينة العامة',
    familyCodeArticles: ['المواد 167–168', 'المادة 180'],
    fiqhSourceOrCircular: 'المواد 167 و168 و180 من قانون الأسرة الجزائري: الرد إلى أصحاب الفروض غير الزوجين، ثم ضوابط رد الباقي إلى الزوجين، ومراتب ذوي الأرحام، وأخيراً أيلولة المال إلى الخزينة عند عدم وجود مستحق.',
    schoolOfThought: 'قانون الأسرة الجزائري',
    descriptionAr: 'يُفحص ورثة التركة ذاتها. لا يرد باقي التركة إلى الزوج أو الزوجة وفق المادة 167 ولا تؤول إلى الخزينة وفق المادة 180 قبل التحقق من ذوي الأرحام وفق المادة 168. ولا تُنقل حصة المتوفى إلى عصبة المرحلة السابقة لمجرد ظهورها في الفريضة الأولى.',
    defaultSetting: true,
    lastReviewedBy: 'مطابقة المواد 167 و168 و180 مع النص المرفق؛ يلزم الاستقصاء الفعلي للقرابة',
    lastReviewedDate: '2026-11-07',
    verifiedSource: true,
    sourceUrl: 'https://droit.mjustice.gov.dz/ar/content/%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%A3%D8%B3%D8%B1%D8%A9',
  },
  GRANDFATHER_AND_SIBLINGS_MALIKI: {
    id: 'GRANDFATHER_AND_SIBLINGS_MALIKI',
    nameAr: 'ميراث الجد الصحيح مع الإخوة',
    familyCodeArticles: ['المادة 158'],
    fiqhSourceOrCircular: 'المادة 158 من قانون الأسرة الجزائري؛ وقد أخذ المشرع بطريقة زيد بن ثابت في تخيير الجد بين الخيارات التي حددها النص.',
    schoolOfThought: 'طريقة زيد بن ثابت كما أخذ بها المشرع الجزائري في المادة 158',
    descriptionAr: 'عند اجتماع الجد العاصب مع الإخوة الأشقاء أو لأب: يقارن المحرك ثلث جميع المال أو المقاسمة؛ ومع أصحاب الفروض يقارن السدس من جميع المال وثلث الباقي والمقاسمة، ثم يختار الأحظ للجد.',
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
  MISSING_PERSON_DEAD_PRESUMPTION: {
    id: 'MISSING_PERSON_DEAD_PRESUMPTION',
    nameAr: 'قسمة التركات في وجود قاصر أو غياب الولي أو الوصي',
    familyCodeArticles: ['المادتان 109 و173', 'المواد 181–183'],
    fiqhSourceOrCircular: 'المادة 181 تحيل إلى المادتين 109 و173، وإلى أحكام القانون المدني في الملكية الشائعة؛ والمادتان 182 و183 تنظمان تصفية التركة والإجراءات المستعجلة.',
    schoolOfThought: 'قانون الأسرة الجزائري والقانون المدني',
    descriptionAr: 'لا تختزل المواد 181–183 في افتراض موت المفقود: يجب مراعاة أحكام الغائب/المفقود والحمل عند القسمة، وتكون القسمة قضائية عند وجود قاصر بين الورثة، ويجوز طلب تصفية التركة وتعيين مقدم عند عدم وجود ولي أو وصي، مع اتباع الإجراءات المستعجلة.',
    defaultSetting: true,
    lastReviewedBy: 'مطابقة المواد 181–183 مع النص المرفق',
    lastReviewedDate: '2026-11-07',
    verifiedSource: true,
  },
};

export function getInterpretationSetting(id: string): boolean {
  return LEGAL_INTERPRETATIONS_REGISTRY[id]?.defaultSetting ?? true;
}

