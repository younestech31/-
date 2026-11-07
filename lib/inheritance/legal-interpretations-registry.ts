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
    descriptionAr: 'يحدد ما إذا كان تعدد الإخوة المحجوبين (نحو إخوة لأب محجوبين بالابن) يخفض نصيب الأم من الثلث إلى السدس.',
    defaultSetting: false,
    lastReviewedBy: 'خيار افتراضي للمنصة (غير ملزم)',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
  AKDARIYYA_PATERNAL_SISTER: {
    id: 'AKDARIYYA_PATERNAL_SISTER',
    nameAr: 'توسيع المسألة العمرية (الكدرية) لتشمل الأخت لأب',
    familyCodeArticles: ['المادة 154', 'المادة 175'],
    fiqhSourceOrCircular: 'الفقه المالكي وقواعد المسألة الكدرية (المادتان 154 و175 من قانون الأسرة الجزائري)',
    schoolOfThought: 'العمل الفقهي وقانون الأسرة',
    descriptionAr: 'تمديد تطبيق حكم المسألة الكدرية (تشريك الجد مع الأخت) ليشمل الأخت لأب عند عدم وجود الأخت الشقيقة.',
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
    nameAr: 'مقاسمة الجد للأخوة للأب والأم (المذهب المالكي)',
    familyCodeArticles: ['المادة 154', 'المادة 155'],
    fiqhSourceOrCircular: 'مذهب الإمام مالك بن أنس والمادة 154 من قانون الأسرة الجزائري',
    schoolOfThought: 'المذهب المالكي',
    descriptionAr: 'حجب الإخوة لأب بالأجداد، ومقاسمة الجد للإخوة لأب وأم وفق الضوابط الفقهية المقررة.',
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
  MISSING_PERSON_DEAD_PRESUMPTION: {
    id: 'MISSING_PERSON_DEAD_PRESUMPTION',
    nameAr: 'مدة الحكم بموت المفقود وحفظ تركته (المادة 181-183)',
    familyCodeArticles: ['المادة 180', 'المادة 181', 'المادة 182', 'المادة 183'],
    fiqhSourceOrCircular: 'أحكام المفقود في المواد 180-183 من قانون الأسرة الجزائري',
    schoolOfThought: 'قانون الأسرة الجزائري والتشريع الإسلامي',
    descriptionAr: 'قواعد اعتبار المفقود ميتاً حكماً لتوزيع تركته على الورثة الأحياء وقت الحكم أو وقت الفقد.',
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
  },
};

export function getInterpretationSetting(id: string): boolean {
  return LEGAL_INTERPRETATIONS_REGISTRY[id]?.defaultSetting ?? true;
}

