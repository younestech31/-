// data/awl-radd.ts

export const AWL_RADD_RULES = {
  awl: {
    nameAr: 'العول',
    article: 166,
    description: 'زيادة سهام أصحاب الفروض على أصل المسألة. إذا زادت أنصبة الفروض قُسمت التركة بنسبة أنصبائهم'
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
