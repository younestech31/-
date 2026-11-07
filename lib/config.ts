export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mawarith.vercel.app';

export const SITE_CONFIG = {
  name: 'مواريث',
  version: '1.3',
  product: 'mawarith',
} as const;

export const PRODUCT_MODES = {
  LOCAL: {
    id: 'local',
    nameAr: 'الوضع المحلي',
    descriptionAr: 'تتم الحسابات ومعالجة المسائل والحفظ داخل المتصفح. لا يتطلب التطبيق إنشاء حساب ولا يرسل بيانات القضايا أو الورثة إلى خادم.',
    zeroNetwork: true,
  },
} as const;
