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


