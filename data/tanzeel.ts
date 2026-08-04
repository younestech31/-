// data/tanzeel.ts

export const TANZEEL_RULES = {
  nameAr: 'التنزيل',
  articles: [169, 170, 171, 172],
  description: 'من توفى وله أحفاد وقد مات مورثهم قبله أو معه وجب تنزيلهم منزلة أصلهم في التركة',
  conditions: [
    {
      id: 'share_limit',
      conditionAr: 'أسهم الأحفاد بمقدار حصة أصلهم لو بقي حيا على ألا تتجاوز ثلث التركة',
      article: 170
    },
    {
      id: 'not_heir',
      conditionAr: 'ألا يكون الأحفاد وارثين للأصل جداً كان أو جدة',
      article: 171
    },
    {
      id: 'not_bequeathed',
      conditionAr: 'ألا يكون قد أوصى لهم أو أعطاهم في حياته بلا عوض مقدار ما يستحق',
      article: 171
    },
    {
      id: 'not_inherited',
      conditionAr: 'ألا يكون الأحفاد قد ورثوا من أبيهم أو أمهم ما لا يقل عن مناب مورثهم',
      article: 172,
      fieldKey: 'alreadyInheritedFromParentAmount'
    }
  ],
  distribution: 'للذكر مثل حظ الأنثيين'
};
