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
    descriptionAr: 'تطبيق حكم المسألة الأكدرية على الأخت الشقيقة أو الأخت لأب وفق التكوين المحدد حصراً في المادة 175.'
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
  MUNASAKHAT_NO_HEIRS_TREASURY: {
    id: 'MUNASAKHAT_NO_HEIRS_TREASURY',
    nameAr: 'أيلولة التركة عند عدم وجود وارث إلى الخزينة العامة',
    familyCodeArticles: ['المادة 180'],
    fiqhSourceOrCircular: 'المادة 180 من قانون الأسرة الجزائري: عند عدم وجود ذوي فروض أو عصبة تؤول التركة إلى ذوي الأرحام، فإن لم يوجدوا آلت إلى الخزينة العامة.',
    schoolOfThought: 'قانون الأسرة الجزائري',
    descriptionAr: 'يُفحص ورثة هذه التركة ذاتها وفق ترتيب المادة 180. لا تُنقل حصة المتوفى إلى عصبة المرحلة السابقة لمجرد ظهورها في الفريضة الأولى.',
    defaultSetting: true,
    lastReviewedBy: 'مطابقة نصية أولية مع المصدر الرسمي؛ التطبيق التفصيلي يحتاج مراجعة قانونية عند النزاع',
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
    nameAr: 'مدة الحكم بموت المفقود وحفظ تركته (المادة 181-183)',
    familyCodeArticles: ['المواد 109–115', 'المادة 133'],
    fiqhSourceOrCircular: 'الفصل السادس من النيابة الشرعية (المواد 109–115) والمادة 133 من كتاب الميراث.',
    schoolOfThought: 'قانون الأسرة الجزائري',
    descriptionAr: 'قواعد الغائب والمفقود وإثبات موته حكماً، مع اعتبار المفقود حياً في باب الإرث إلى أن يثبت موته بحكم وفق الشروط القانونية.'
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
};

export function getInterpretationSetting(id: string): boolean {
  return LEGAL_INTERPRETATIONS_REGISTRY[id]?.defaultSetting ?? true;
}

