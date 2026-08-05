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
    nameAr: 'سياسة تؤول تركة المناسخات التي لا وارث لها للخزينة أو العصبة السابقة',
    familyCodeArticles: ['المادة 150', 'المادة 151', 'المادة 152', 'المادة 153', 'المادة 154', 'المادة 182'],
    fiqhSourceOrCircular: 'قواعد أيلولة التركة الخالية من الورثة للخزينة العامة وفق قانون الأسرة الجزائري (المادة 182) والاجتهاد الفقهي للمنصة (خيار افتراضي للمنصة، ليس حكماً قضائياً ملزماً)',
    schoolOfThought: 'المذهب المالكي وقانون الأسرة',
    descriptionAr: 'عند عدم وجود ورثة في مرحلة مناسخة ثانية، يتم التحقق أولاً من وجود عصبة في التركة الأولى قبل إحالتها إلى بيت المال (الخزينة العامة).',
    defaultSetting: true,
    lastReviewedBy: 'خيار افتراضي للمنصة (قرار تطبيقي)',
    lastReviewedDate: '2026-01-15',
    verifiedSource: true,
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

