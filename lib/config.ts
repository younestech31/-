export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lattab.vercel.app';

export const OFFICE_INFO = {
  notaryFullName: 'الأستاذ لعطب محمد',
  title: 'موثق لدى محكمة فلاوسن — ولاية وهران',
  officialDesignation: 'الديوان العمومي للتوثيق',
  jurisdiction: 'ولاية وهران — الجزائر',
  legalBasis: 'طبقاً للقانون رقم 06-02 المؤرخ في 20 فبراير 2006',
  phone: {
    display: '+213 562 29 69 81',
    number: '+213562296981',
  },
  email: 'maitrelattabmohamed@gmail.com',
} as const;

export const TITLE_TEMPLATE_SUFFIX = ' — موثق وهران' as const;

export const WORKING_HOURS = {
  days: 'الأحد - الخميس',
  morning: '08:30 - 12:00',
  afternoon: '13:30 - 16:00',
  full: 'الأحد - الخميس: 08:30 - 12:00 و 13:30 - 16:00',
  closed: 'الجمعة والسبت: مغلق'
} as const;

export const SITE_CONFIG = {
  version: '1.2',
} as const;

export const PRODUCT_MODES = {
  LOCAL: {
    id: 'local',
    nameAr: 'الوضع المحلي بالكامل (Zero-Network)',
    descriptionAr: 'حسابات وتصفية التركات تتم 100% داخل المتصفح دون إنشاء حساب ودون إرسال أي بيانات أسماء أو أرقام إلى خوادم خارجية. يتم تشفير البيانات المحفوظة محلياً بمفتاح عشوائي يُولّد لكل جهاز على حدة ويُحفظ في IndexedDB.',
    zeroNetwork: true,
  },
  CLOUD: {
    id: 'cloud',
    nameAr: 'وضع المكتب السحابي للموثقين (Cloud Sync)',
    descriptionAr: 'يتطلب حساب ديوان توثيق موثق بـ JWT. يتيح للمكتب مزامنة سجلات التركات والمسائل بين عدة أجهزة مشفرة من جانب العميل مع حفظ البيانات المشفرة فقط في قاعدة بيانات المنصة بموافقة صريحة.',
    zeroNetwork: false,
  },
} as const;
