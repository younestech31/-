import { Heir } from '@/lib/types/inheritance';

export const HEIRS: Heir[] = [
  // ==================== أصحاب النصف ====================
  {
    id: 'husband',
    nameAr: 'الزوج',
    nameEn: 'Husband',
    gender: 'male',
    category: 'furud',
    article: 144,
    shares: [
      {
        fraction: '1/2',
        condition: 'no_direct_heir',
        conditionAr: 'عند عدم وجود الفرع الوارث للزوجة'
      },
      {
        fraction: '1/4',
        condition: 'has_direct_heir',
        conditionAr: 'عند وجود الفرع الوارث للزوجة'
      }
    ],
    blockedBy: [],
    blocks: [],
    notes: 'المادة 144 - يستحق النصف عند عدم وجود الفرع الوارث، والربع عند وجوده',
    allowMultiple: false
  },

  {
    id: 'daughter',
    nameAr: 'البنت',
    nameEn: 'Daughter',
    gender: 'female',
    category: 'furud',
    article: 144,
    shares: [
      {
        fraction: '1/2',
        condition: 'alone_no_son',
        conditionAr: 'عند الانفراد عن ولد الصلب ذكراً أو أنثى'
      },
      {
        fraction: '2/3',
        condition: 'multiple_no_son',
        conditionAr: 'بنتان فأكثر بشرط عدم وجود الابن'
      },
      {
        fraction: 'residue',
        condition: 'with_son',
        conditionAr: 'مع أخيها الابن تصبح عاصبة بغيره (للذكر مثل حظ الأنثيين)'
      }
    ],
    blockedBy: [],
    blocks: ['granddaughter'],
    notes: 'المادة 144، 147',
    allowMultiple: true
  },

  {
    id: 'granddaughter',
    nameAr: 'بنت الابن',
    nameEn: "Son's Daughter",
    gender: 'female',
    category: 'furud',
    article: 144,
    shares: [
      {
        fraction: '1/2',
        condition: 'alone_no_son_no_daughter',
        conditionAr: 'عند الانفراد عن ولد الصلب ذكراً أو أنثى وولد الابن في درجتها'
      },
      {
        fraction: '1/6',
        condition: 'with_one_daughter',
        conditionAr: 'إذا كانت مع بنت الصلب الواحدة ولم يكن معها ابن ابن في درجتها'
      },
      {
        fraction: '2/3',
        condition: 'multiple_alone',
        conditionAr: 'بنتا الابن فأكثر بشرط عدم وجود ولد الصلب وابن الابن في درجتهما'
      },
      {
        fraction: 'residue',
        condition: 'with_brother_son',
        conditionAr: 'مع أخيها أو ابن عمها المساوي لها في الدرجة (عاصبة بغيره)'
      }
    ],
    blockedBy: ['son', 'daughter_multiple', 'son_son_same_level'],
    blocks: [],
    notes: 'المادة 144، 147، 149، 160، 163',
    allowMultiple: true
  },

  {
    id: 'full_sister',
    nameAr: 'الأخت الشقيقة',
    nameEn: 'Full Sister',
    gender: 'female',
    category: 'furud',
    article: 144,
    shares: [
      {
        fraction: '1/2',
        condition: 'alone',
        conditionAr: 'عند الانفراد وعدم وجود الشقيق والأب وولد الصلب وولد الابن والجد الذي يعصبها'
      },
      {
        fraction: '2/3',
        condition: 'multiple',
        conditionAr: 'الشقيقتان فأكثر بشرط عدم وجود الشقيق الذكر أو الأب أو ولد الصلب'
      },
      {
        fraction: 'residue',
        condition: 'asaba_with_brother',
        conditionAr: 'مع أخيها الشقيق (عاصبة بغيره) - للذكر مثل حظ الأنثيين'
      },
      {
        fraction: 'residue',
        condition: 'asaba_with_daughters',
        conditionAr: 'عاصبة مع غيرها عند وجود بنات الصلب أو بنات الابن'
      }
    ],
    blockedBy: ['father', 'son', 'son_son', 'full_brother'],
    blocks: ['paternal_sister'],
    notes: 'المادة 144، 147، 156، 164',
    allowMultiple: true
  },

  {
    id: 'paternal_sister',
    nameAr: 'الأخت لأب',
    nameEn: 'Paternal Half-Sister',
    gender: 'female',
    category: 'furud',
    article: 144,
    shares: [
      {
        fraction: '1/2',
        condition: 'alone',
        conditionAr: 'عند الانفراد وعدم وجود من ذُكر في الشقيقة'
      },
      {
        fraction: '1/6',
        condition: 'with_full_sister',
        conditionAr: 'إذا كانت مع الأخت الشقيقة (تكملة الثلثين)'
      },
      {
        fraction: '2/3',
        condition: 'multiple_alone',
        conditionAr: 'الأختان لأب فأكثر بشرط عدم وجود الأخ لأب ومن ذُكر في الشقيقتين'
      },
      {
        fraction: 'residue',
        condition: 'asaba_with_brother',
        conditionAr: 'مع أخيها لأب (عاصبة بغيره)'
      }
    ],
    blockedBy: ['father', 'son', 'son_son', 'full_brother', 'full_sister_asaba', 'two_full_sisters'],
    blocks: [],
    notes: 'المادة 144، 147، 149، 157، 164',
    allowMultiple: true
  },

  // ==================== أصحاب الربع ====================
  {
    id: 'wife',
    nameAr: 'الزوجة / الزوجات',
    nameEn: 'Wife / Wives',
    gender: 'female',
    category: 'furud',
    article: 145,
    shares: [
      {
        fraction: '1/4',
        condition: 'no_direct_heir',
        conditionAr: 'عند عدم وجود الفرع الوارث للزوج'
      },
      {
        fraction: '1/8',
        condition: 'has_direct_heir',
        conditionAr: 'عند وجود الفرع الوارث للزوج'
      }
    ],
    blockedBy: [],
    blocks: [],
    notes: 'المادة 145، 146 - تشترك الزوجات في النصيب إذا تعددن',
    allowMultiple: true
  },

  // ==================== أصحاب الثلث ====================
  {
    id: 'mother',
    nameAr: 'الأم',
    nameEn: 'Mother',
    gender: 'female',
    category: 'furud',
    article: 148,
    shares: [
      {
        fraction: '1/3',
        condition: 'no_direct_heir_no_siblings',
        conditionAr: 'عند عدم وجود الفرع الوارث أو عدد من الإخوة (أشقاء أو لأب أو لأم)'
      },
      {
        fraction: '1/6',
        condition: 'has_direct_heir_or_siblings',
        conditionAr: 'عند وجود فرع وارث أو عدد من الإخوة سواء كانوا وارثين أو محجوبين'
      },
      {
        fraction: '1/3',
        condition: 'gharawain_after_spouse',
        conditionAr: 'ثلث الباقي في مسألة الغراوين (مع الزوج/الزوجة والأبوين)'
      }
    ],
    blockedBy: [],
    blocks: ['grandmother_all'],
    notes: 'المادة 148، 149، 161 - تحجب كل جدة',
    allowMultiple: false
  },

  {
    id: 'maternal_siblings',
    nameAr: 'الإخوة لأم',
    nameEn: 'Maternal Half-Siblings',
    gender: 'both',
    category: 'furud',
    article: 148,
    shares: [
      {
        fraction: '1/6',
        condition: 'single',
        conditionAr: 'الأخ أو الأخت للأم منفرداً ذكراً كان أو أنثى عند عدم وجود الأصل والفرع الوارث'
      },
      {
        fraction: '1/3',
        condition: 'multiple',
        conditionAr: 'عند تعددهم بشرط انفرادهم عن الأب والجد للأب وولد الصلب وولد الابن'
      }
    ],
    blockedBy: ['father', 'grandfather', 'son', 'son_son', 'daughter', 'granddaughter'],
    blocks: [],
    notes: 'المادة 148، 149 - يتساوى الذكر والأنثى في الميراث (مسألة مشتركة م.176)',
    allowMultiple: true
  },

  // ==================== أصحاب السدس ====================
  {
    id: 'father',
    nameAr: 'الأب',
    nameEn: 'Father',
    gender: 'male',
    category: 'furud',
    article: 149,
    shares: [
      {
        fraction: '1/6',
        condition: 'has_son_or_grandson',
        conditionAr: 'عند وجود الولد أو ولد الابن ذكراً أو أنثى'
      },
      {
        fraction: 'residue',
        condition: 'no_son',
        conditionAr: 'عند عدم وجود الابن يرث بالتعصيب'
      },
      {
        fraction: '1/6',
        condition: 'furud_plus_residue',
        conditionAr: 'يأخذ السدس فرضاً والباقي تعصيباً عند وجود البنت أو بنت الابن مع عدم الابن'
      }
    ],
    blockedBy: [],
    blocks: ['grandfather', 'full_brother', 'paternal_brother', 'maternal_brother', 'all_brothers_sons'],
    notes: 'المادة 149، 162 - يحجب الجد وأولاد الإخوة',
    allowMultiple: false
  },

  {
    id: 'grandfather',
    nameAr: 'الجد للأب',
    nameEn: 'Paternal Grandfather',
    gender: 'male',
    category: 'furud',
    article: 149,
    shares: [
      {
        fraction: '1/6',
        condition: 'has_son_grandson_no_father',
        conditionAr: 'عند وجود الولد أو ولد الابن وعند عدم وجود الأب'
      },
      {
        fraction: 'residue',
        condition: 'no_son_no_father',
        conditionAr: 'يرث بالتعصيب عند عدم وجود الابن والأب'
      },
      {
        fraction: '1/3',
        condition: 'with_siblings_third_better',
        conditionAr: 'مع الإخوة إذا كان الثلث أحظى له (مسألة الجد والإخوة م.158)'
      },
      {
        fraction: 'residue',
        condition: 'with_siblings_muqasama_better',
        conditionAr: 'مع الإخوة إذا كانت المقاسمة أحظى له'
      }
    ],
    blockedBy: ['father'],
    blocks: ['brothers_sons'],
    notes: 'المادة 149، 158 - أحوال الجد مع الإخوة تفصيل في م.158',
    allowMultiple: false
  },

  {
    id: 'maternal_grandmother',
    nameAr: 'الجدة لأم',
    nameEn: 'Maternal Grandmother',
    gender: 'female',
    category: 'furud',
    article: 149,
    shares: [
      {
        fraction: '1/6',
        condition: 'no_mother',
        conditionAr: 'عند عدم وجود الأم'
      }
    ],
    blockedBy: ['mother'],
    blocks: [],
    notes: 'المادة 149، 161 - تحجبها الأم',
    allowMultiple: false
  },
  {
    id: 'paternal_grandmother',
    nameAr: 'الجدة لأب',
    nameEn: 'Paternal Grandmother',
    gender: 'female',
    category: 'furud',
    article: 149,
    shares: [
      {
        fraction: '1/6',
        condition: 'no_mother_no_father',
        conditionAr: 'عند عدم وجود الأم والأب'
      }
    ],
    blockedBy: ['mother', 'father', 'grandfather'],
    blocks: [],
    notes: 'المادة 149، 161 - تحجبها الأم والأب وكذا الجد إذا كانت من جهته',
    allowMultiple: false
  },

  // ==================== العصبة ====================
  {
    id: 'son',
    nameAr: 'الابن',
    nameEn: 'Son',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'always',
        conditionAr: 'يرث الباقي بعد أصحاب الفروض - العاصب بنفسه (جهة البنوة)'
      }
    ],
    blockedBy: [],
    blocks: ['granddaughter_lower', 'full_brother', 'paternal_brother', 'maternal_brother', 'uncles'],
    notes: 'المادة 152، 153 - جهة البنوة تقدم على غيرها',
    allowMultiple: true
  },

  {
    id: 'son_son',
    nameAr: 'ابن الابن (وإن نزل)',
    nameEn: "Grandson (Son's Son)",
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_son',
        conditionAr: 'عند عدم وجود الابن - العاصب بنفسه (جهة البنوة)'
      }
    ],
    blockedBy: ['son'],
    blocks: [],
    notes: 'المادة 153 - يُدلى بالابن',
    allowMultiple: true
  },

  {
    id: 'full_brother',
    nameAr: 'الأخ الشقيق',
    nameEn: 'Full Brother',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_son_no_son_son_no_father_no_grandfather',
        conditionAr: 'عاصب بنفسه - جهة الأخوة - عند عدم وجود الابن وابن الابن والأب والجد'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather'],
    blocks: ['paternal_brother', 'brothers_sons'],
    notes: 'المادة 153، 164',
    allowMultiple: true
  },

  {
    id: 'paternal_brother',
    nameAr: 'الأخ لأب',
    nameEn: 'Paternal Half-Brother',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_full_brother',
        conditionAr: 'عاصب بنفسه عند عدم وجود الأخ الشقيق والابن وابن الابن والأب'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother'],
    blocks: ['paternal_brothers_sons'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'full_nephew',
    nameAr: 'ابن الأخ الشقيق',
    nameEn: 'Full Nephew',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه عند عدم وجود عاصب أقرب (أصل أو فرع أو حواشي أقرب)'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_sister_asaba', 'paternal_sister_asaba'],
    blocks: ['paternal_nephew'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'paternal_nephew',
    nameAr: 'ابن الأخ لأب',
    nameEn: 'Paternal Nephew',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه عند عدم وجود عاصب أقرب'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_nephew'],
    blocks: ['all_uncles'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'full_uncle',
    nameAr: 'العم الشقيق',
    nameEn: 'Full Paternal Uncle',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه - جهة العمومة'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_nephew', 'paternal_nephew'],
    blocks: ['paternal_uncle', 'uncles_sons'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'paternal_uncle',
    nameAr: 'العم لأب',
    nameEn: 'Paternal Uncle',
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_nephew', 'paternal_nephew', 'full_uncle'],
    blocks: ['uncles_sons'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'full_uncle_son',
    nameAr: 'ابن العم الشقيق',
    nameEn: "Son of Full Paternal Uncle",
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_nephew', 'paternal_nephew', 'full_uncle', 'paternal_uncle'],
    blocks: ['paternal_uncle_son'],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'paternal_uncle_son',
    nameAr: 'ابن العم لأب',
    nameEn: "Son of Paternal Uncle",
    gender: 'male',
    category: 'asaba',
    article: 153,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_higher_asaba',
        conditionAr: 'عاصب بنفسه'
      }
    ],
    blockedBy: ['son', 'son_son', 'father', 'grandfather', 'full_brother', 'paternal_brother', 'full_nephew', 'paternal_nephew', 'full_uncle', 'paternal_uncle', 'full_uncle_son'],
    blocks: [],
    notes: 'المادة 153، 165',
    allowMultiple: true
  },
  {
    id: 'maternal_grandfather',
    nameAr: 'الجد لأم',
    nameEn: 'Maternal Grandfather',
    gender: 'male',
    category: 'arham',
    article: 168,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_furud_no_asaba',
        conditionAr: 'يرث عند انعدام أصحاب الفروض والعصبات (عدا الزوجين) - من ذوي الأرحام'
      }
    ],
    blockedBy: [],
    blocks: [],
    notes: 'المادة 168 - من ذوي الأرحام',
    allowMultiple: false
  },
  {
    id: 'distant_kindred',
    nameAr: 'ذوو الأرحام',
    nameEn: 'Distant Kindred',
    gender: 'both',
    category: 'arham',
    article: 168,
    shares: [
      {
        fraction: 'residue',
        condition: 'no_furud_no_asaba',
        conditionAr: 'يرثون عند انعدام أصحاب الفروض والعصبات (عدا الزوجين)'
      }
    ],
    blockedBy: ['all_furud', 'all_asaba'],
    blocks: [],
    notes: 'المادة 168 - يشمل الخال والخالة والعمة وبنت الأخ وبنت البنت وغيرهم',
    allowMultiple: true
  },
  {
    id: 'mandatory_bequest',
    nameAr: 'الوصية الواجبة',
    nameEn: 'Mandatory Bequest',
    gender: 'both',
    category: 'bequest',
    article: 169,
    shares: [],
    blockedBy: [],
    blocks: [],
    notes: 'المواد 169-172 من قانون الأسرة - تُمنح للأحفاد الذين مات أبوهم أو أمهم قبل المتوفى',
    allowMultiple: false
  },
  {
    id: 'voluntary_bequest',
    nameAr: 'الوصية الاختيارية',
    nameEn: 'Voluntary Bequest',
    gender: 'both',
    category: 'bequest',
    article: 184,
    shares: [],
    blockedBy: [],
    blocks: [],
    notes: 'تنفذ في حدود الثلث بعد سداد الديون والوصية الواجبة',
    allowMultiple: false
  },
];

export const MAX_COUNTS: Record<string, number> = {
  husband: 1,
  wife: 4,
  father: 1,
  mother: 1,
  grandfather: 1,
  maternal_grandmother: 1,
  paternal_grandmother: 1,
  maternal_grandfather: 1,
  son: 99,
  daughter: 99,
  son_son: 99,
  granddaughter: 99,
  full_brother: 99,
  full_sister: 99,
  paternal_brother: 99,
  paternal_sister: 99,
  maternal_siblings: 99,
  full_nephew: 99,
  paternal_nephew: 99,
  full_uncle: 99,
  paternal_uncle: 99,
  full_uncle_son: 99,
  paternal_uncle_son: 99,
};
