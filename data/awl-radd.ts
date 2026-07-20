// data/awl-radd.ts

export const AWL_RADD_RULES = {
  awl: {
    nameAr: 'العول',
    article: 166,
    description: 'زيادة سهام أصحاب الفروض على أصل المسألة. إذا زادت أنصبة الفروض قُسمت التركة بنسبة أنصبائهم',
    commonCases: [
      {
        nameAr: 'مسألة المنبرية',
        article: 179,
        heirs: ['wife', 'two_daughters', 'father', 'mother'],
        originalBase: 24,
        awlBase: 27,
        shares: {
          two_daughters: 16,  // 16/27
          father: 4,          // 4/27 (سدس)
          mother: 4,          // 4/27 (سدس)
          wife: 3             // 3/27 (صار ثمنها تسعاً)
        }
      },
      {
        nameAr: 'مسألة الأكدرية',
        article: 175,
        heirs: ['husband', 'mother', 'full_sister_or_paternal', 'grandfather'],
        originalBase: 6,
        awlBase: 9,
        awlCorrection: 27, // تصح من 27
        shares: {
          husband: 9,     // 9/27
          mother: 6,      // 6/27
          full_sister: 4, // 4/27
          grandfather: 8  // 8/27
        },
        notes: 'الجد يضم ما حُسب له إلى ما حُسب للأخت ويقتسمان للذكر مثل حظ الأنثيين'
      },
      {
        nameAr: 'مسألة المباهلة',
        article: 178,
        heirs: ['husband', 'mother', 'full_sister_or_paternal'],
        originalBase: 6,
        awlBase: 8,
        shares: {
          husband: 3,      // 3/8
          full_sister: 3,  // 3/8
          mother: 2        // 2/8
        }
      }
    ]
  },

  radd: {
    nameAr: 'الرد',
    article: 167,
    description: 'إذا لم تستغرق التركة ولم يوجد عصبة من النسب، رُد الباقي على غير الزوجين من أصحاب الفروض بنسبة فروضهم',
    notes: 'يُرد باقي التركة إلى أحد الزوجين إذا لم يوجد عصبة من النسب أو أحد أصحاب الفروض النسبية أو ذوو الأرحام'
  },

  gharawain: {
    nameAr: 'مسألة الغراوين',
    article: 177,
    cases: [
      {
        nameAr: 'زوجة وأبوان',
        heirs: ['wife', 'father', 'mother'],
        shares: {
          wife: '1/4',
          mother: '1/4',    // ثلث الباقي
          father: 'residue'
        }
      },
      {
        nameAr: 'زوج وأبوان',
        heirs: ['husband', 'father', 'mother'],
        shares: {
          husband: '1/2',
          mother: '1/6',    // ثلث الباقي
          father: 'residue'
        }
      }
    ]
  },

  mushtaraka: {
    nameAr: 'المسألة المشتركة',
    article: 176,
    description: 'زوج وأم أو جدة وإخوة لأم وإخوة أشقاء - يشترك الإخوة للأم والإخوة الأشقاء في الثلث على عدد رؤوسهم',
    notes: 'الذكر كالأنثى لأن جميعهم من أم واحدة'
  },
  akdariya: {
    nameAr: 'المسألة الأكدرية',
    article: 175,
    description: 'زوج وأم وجد وأخت شقيقة أو لأب. يعول الفرض ويقتسم الجد والأخت الباقي للذكر مثل حظ الأنثيين',
    notes: 'تصح من سبعة وعشرين (27)'
  }
};
