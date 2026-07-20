export type ShareFraction = 
  | '1/2'   // النصف
  | '1/4'   // الربع
  | '1/8'   // الثمن
  | '2/3'   // الثلثان
  | '1/3'   // الثلث
  | '1/6'   // السدس
  | 'residue' // التعصيب (ما تبقى)
  | 'none';   // لا يرث

export type HeirCategory = 
  | 'furud'    // أصحاب فروض
  | 'asaba'    // عصبة
  | 'arham'    // ذوو الأرحام
  | 'bequest'; // الوصايا

export type Gender = 'male' | 'female' | 'both';

export interface Heir {
  id: string;
  nameAr: string;
  nameEn: string;
  gender: Gender;
  category: HeirCategory;
  article: number; // رقم المادة في القانون
  shares: HeirShare[];
  blockedBy: string[]; // يُحجب بوجود...
  blocks: string[];    // يحجب...
  notes: string;
  allowMultiple: boolean;
}

export interface HeirShare {
  fraction: ShareFraction;
  condition: string; // الشرط لاستحقاق هذا النصيب
  conditionAr: string;
}

export interface InheritanceRule {
  id: string;
  nameAr: string;
  article: number;
  description: string;
}
