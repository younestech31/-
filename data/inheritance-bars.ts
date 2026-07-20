// data/inheritance-bars.ts

export interface InheritanceBar {
  id: string;
  nameAr: string;
  article: number;
  description: string;
}

export const INHERITANCE_BARS: InheritanceBar[] = [
  {
    id: 'intentional_killer',
    nameAr: 'قاتل المورث عمداً أو عدواناً',
    article: 135,
    description: 'سواء كان فاعلاً أصلياً أو شريكاً - المادة 135/1'
  },
  {
    id: 'false_witness',
    nameAr: 'شاهد الزور الذي أدت شهادته إلى الحكم بالإعدام وتنفيذه',
    article: 135,
    description: 'المادة 135/2'
  },
  {
    id: 'concealed_murder',
    nameAr: 'العالم بالقتل أو تدبيره إذا لم يخبر السلطات المعنية',
    article: 135,
    description: 'المادة 135/3'
  },
  {
    id: 'lian',
    nameAr: 'اللعان',
    article: 138,
    description: 'يمنع من الإرث - المادة 138'
  },
  {
    id: 'apostasy',
    nameAr: 'الردة',
    article: 138,
    description: 'يمنع من الإرث - المادة 138'
  },
  {
    id: 'involuntary_killer',
    nameAr: 'القاتل خطأ',
    article: 137,
    description: 'يرث من المال دون الدية أو التعويض - المادة 137'
  }
];
