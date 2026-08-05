// data/classic-cases.ts

export interface ClassicCase {
  id: string; // Dynamic path matching
  nameAr: string;
  article?: number;
  heirIds: string[];
  counts?: number[];
  descriptionAr: string;
  disputedAr?: string;
}

export const CLASSIC_CASES: ClassicCase[] = [
  {
    id: 'minbariyya',
    nameAr: 'المسألة المنبرية',
    article: 179,
    heirIds: ['wife', 'daughter', 'father', 'mother'],
    counts: [1, 2, 1, 1],
    descriptionAr: 'بنتان وزوجة وأبوان — أصلها 24 وتعول إلى 27 (المادة 179 من قانون الأسرة)'
  },
  {
    id: 'mubahalah',
    nameAr: 'المسألة المباهلة',
    article: 178,
    heirIds: ['husband', 'mother', 'full_sister'],
    counts: [1, 1, 1],
    descriptionAr: 'زوج وأم وأخت شقيقة — أصلها 6 وتعول إلى 8 (المادة 178 من قانون الأسرة)'
  },
  {
    id: 'akdariyya',
    nameAr: 'المسألة الأكدرية',
    article: 175,
    heirIds: ['husband', 'mother', 'grandfather', 'full_sister'],
    counts: [1, 1, 1, 1],
    descriptionAr: 'زوج وأم وجد وأخت شقيقة — تصح وتصحح من 27 (المادة 175 من قانون الأسرة)'
  },
  {
    id: 'gharawain-husband',
    nameAr: 'الغراوان الأولى (زوج وأبوان)',
    article: 177,
    heirIds: ['husband', 'father', 'mother'],
    counts: [1, 1, 1],
    descriptionAr: 'الأم ترث ثلث الباقي لا ثلث الكل بعد أخذ الزوج نصيبه (المادة 177 من قانون الأسرة)'
  },
  {
    id: 'gharawain-wife',
    nameAr: 'الغراوان الثانية (زوجة وأبوان)',
    article: 177,
    heirIds: ['wife', 'father', 'mother'],
    counts: [1, 1, 1],
    descriptionAr: 'الأم ترث ثلث الباقي لا ثلث الكل بعد فرض الزوجة الربع (المادة 177 من قانون الأسرة)'
  },
  {
    id: 'musharrakah',
    nameAr: 'المسألة المشتركة (الحمارية)',
    article: 176,
    heirIds: ['husband', 'mother', 'maternal_siblings', 'full_brother'],
    counts: [1, 1, 2, 1],
    descriptionAr: 'مشاركة الإخوة الأشقاء مع إخوة الأم في الثلث — الذكر كالأنثى (المادة 176 من قانون الأسرة)'
  },
  {
    id: 'marwaniyyah',
    nameAr: 'المسألة المروانية',
    heirIds: ['husband', 'full_sister', 'maternal_siblings'],
    counts: [1, 2, 2],
    descriptionAr: 'زوج وأختان شقيقتان وأخوة لأم — عالت من 6 إلى 9'
  },
  {
    id: 'kharqaa',
    nameAr: 'مسألة الخرقاء (أم وجد وأخت شقيقة)',
    article: 175,
    heirIds: ['mother', 'grandfather', 'full_sister'],
    counts: [1, 1, 1],
    descriptionAr: 'أم وجد وأخت شقيقة — كثرت فيها أقوال الصحابة وقيل لكثرة تخرق الأقوال فيها.',
    disputedAr: 'تنبيه شرعي وخلافي: كثرت وتعددت آراء الصحابة والفقهاء في مسألة الخرقاء (علي بن أبي طالب، أبو بكر الصديق، ابن مسعود، وزيد بن ثابت رضي الله عنهم). والحل المعروض هنا يمثل مذهب زيد بن ثابت المقعد في قانون الأسرة (للأم الثلث، وللجد ضعف الأخت تعصيباً).'
  },
  {
    id: 'dinariyyah',
    nameAr: 'المسألة الدينارية الصغرى',
    article: 179,
    heirIds: ['wife', 'mother', 'daughter', 'paternal_sister'],
    counts: [1, 1, 2, 1],
    descriptionAr: 'بنتان وأم وزوجة وأخت لأب — وهي عالت حتى بلغت أصلها 24 وعالت إلى 27'
  },
  {
    id: 'yatimah',
    nameAr: 'المسألة اليتيمة (الغرّاء)',
    article: 175,
    heirIds: ['husband', 'mother', 'full_sister', 'grandfather'],
    counts: [1, 1, 1, 1],
    descriptionAr: 'زوج وأم وأخت شقيقة وجد — تسمى أيضاً اليتيمة لعدم نظير لها في علم الفرائض'
  }
];
