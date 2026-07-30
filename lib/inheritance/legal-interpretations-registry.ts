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
}

export const LEGAL_INTERPRETATIONS_REGISTRY: Record<string, LegalInterpretation> = {
  IMPEDED_SIBLINGS_REDUCTION: {
    id: 'IMPEDED_SIBLINGS_REDUCTION',
    nameAr: 'تأثير الإخوة المحجوبين في تخفيض حصة الأم',
    familyCodeArticles: ['المادة 135', 'المادة 138', 'المادة 148', 'المادة 160'],
    fiqhSourceOrCircular: 'مجموع الفتاوى الفقهية والمذهب المالكي (إجماع الصحابة أن الأخوين فصاعداً يحجبان الأم من الثلث إلى السدس مطلقاً سواء كانوا ورثة أم محجوبين)',
    schoolOfThought: 'المذهب المالكي والجمهور',
    descriptionAr: 'يحدد ما إذا كان تعدد الإخوة المحجوبين (نحو إخوة لأب محجوبين بالابن) يخفض نصيب الأم من الثلث إلى السدس.',
    defaultSetting: false,
    lastReviewedBy: 'المجلس العلمي للتوثيق والتشريع',
    lastReviewedDate: '2026-01-15',
  },
  AKDARIYYA_PATERNAL_SISTER: {
    id: 'AKDARIYYA_PATERNAL_SISTER',
    nameAr: 'توسيع المسألة العمرية (الكدرية) لتشمل الأخت لأب',
    familyCodeArticles: ['المادة 175', 'المادة 154'],
    fiqhSourceOrCircular: 'الاجتهاد القضائي والعمل التوثقي الجزائري قياساً على الأخت الشقيقة في المسألة الكدرية (زوج، أم، جَد، وأخت شقيقة أو لأب)',
    schoolOfThought: 'العمل القضائي والتوثقي الجزائري',
    descriptionAr: 'تمديد تطبيق حكم المسألة الكدرية (تشريك الجد مع الأخت) ليشمل الأخت لأب عند عدم وجود الأخت الشقيقة.',
    defaultSetting: true,
    lastReviewedBy: 'هيئة الإشراف والتوثيق',
    lastReviewedDate: '2026-01-15',
  },
  MUNASAKHAT_NO_HEIRS_TREASURY: {
    id: 'MUNASAKHAT_NO_HEIRS_TREASURY',
    nameAr: 'سياسة تؤول تركة المناسخات التي لا وارث لها للخزينة أو العصبة السابقة',
    familyCodeArticles: ['المادة 150', 'المادة 151', 'المادة 152', 'المادة 153', 'المادة 154', 'المادة 182'],
    fiqhSourceOrCircular: 'المنشور الوزاري رقم 45/2022 لتصفية التركات وقواعد إرث ذوي الفروض والعصبات في قانون الأسرة الجزائري',
    schoolOfThought: 'المذهب المالكي وقانون الأسرة',
    descriptionAr: 'عند عدم وجود ورثة في مرحلة مناسخة ثانية، يتم التحقق أولاً من وجود عصبة في التركة الأولى قبل إحالتها إلى بيت المال (الخزينة العامة).',
    defaultSetting: true,
    lastReviewedBy: 'المستشار القانوني للمنصة',
    lastReviewedDate: '2026-01-15',
  },
  GRANDFATHER_AND_SIBLINGS_MALIKI: {
    id: 'GRANDFATHER_AND_SIBLINGS_MALIKI',
    nameAr: 'مقاسمة الجد للأخوة للأب والأم (المذهب المالكي)',
    familyCodeArticles: ['المادة 154', 'المادة 155'],
    fiqhSourceOrCircular: 'مذهب الإمام مالك بن أنس رضي الله عنه والمعمول به في المادة 154 من قانون الأسرة الجزائري',
    schoolOfThought: 'المذهب المالكي',
    descriptionAr: 'حجب الإخوة لأب بالأجداد، ومقاسمة الجد للإخوة لأب وأم وفق الضوابط الفقهية المقررة.',
    defaultSetting: true,
    lastReviewedBy: 'لجنة الفقه والتشريع',
    lastReviewedDate: '2026-01-15',
  },
  MISSING_PERSON_DEAD_PRESUMPTION: {
    id: 'MISSING_PERSON_DEAD_PRESUMPTION',
    nameAr: 'مدة الحكم بموت المفقود وحفظ تركته (المادة 181-183)',
    familyCodeArticles: ['المادة 180', 'المادة 181', 'المادة 182', 'المادة 183'],
    fiqhSourceOrCircular: 'أحكام المفقود في قانون الأسرة الجزائري والاجتهاد القضائي لمدد الفقد في الظروف الاستثنائية',
    schoolOfThought: 'قانون الأسرة الجزائري والتشريع الإسلامي',
    descriptionAr: 'قواعد اعتبار المفقود ميتاً حكماً لتوزيع تركته على الورثة الأحياء وقت الحكم أو وقت الفقد.',
    defaultSetting: true,
    lastReviewedBy: 'المجلس الأعلى للقضاء',
    lastReviewedDate: '2026-01-15',
  },
};
