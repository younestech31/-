import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SITE_URL } from '@/lib/config';
import type { Viewport } from 'next';

const cairo = localFont({
  src: [
    {
      path: '../public/fonts/cairo-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/cairo-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-cairo',
  display: 'swap',
});

const amiri = localFont({
  src: [
    {
      path: '../public/fonts/amiri-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/amiri-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-amiri',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F3D2E',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'مواريث — حاسبة المواريث الشرعية',
    template: '%s — مواريث',
  },
  description: 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري مع دعم المناسخات وتصفية التركات.',
  keywords: [
    'مواريث', 'حاسبة الميراث', 'حساب الميراث', 'الفرائض', 'المواريث', 'قانون الأسرة الجزائري', 'المناسخات', 'الوصية الواجبة', 'العول', 'الرد'
  ],
  authors: [{ name: 'مكتب الأستاذ لعطب محمد', url: SITE_URL }],
  creator: 'منصة مواريث الرقمية',
  publisher: 'منصة مواريث الرقمية',
  category: 'legal services',
  alternates: {
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'مواريث — حاسبة المواريث الشرعية',
    description: 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري.',
    url: SITE_URL,
    siteName: 'مواريث',
    locale: 'ar_DZ',
    type: 'website',
    images: [
      {
        url: `/social/og-image-1200x630.png`,
        width: 1200,
        height: 630,
        alt: 'مواريث — حاسبة المواريث الشرعية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مواريث — حاسبة المواريث الشرعية',
    description: 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري.',
    images: [`/social/twitter-card-1200x675.png`],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'مواريث — حاسبة المواريث الشرعية',
      'description': 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري مع دعم المناسخات وتصفية التركات.',
      'url': SITE_URL,
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'All',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'منصة مواريث الرقمية',
      'url': SITE_URL,
      'logo': `${SITE_URL}/logo/logo-horizontal-color.svg`,
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+213 562 29 69 81',
        'contactType': 'customer service',
        'availableLanguage': ['Arabic', 'French'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'ما هو الأساس القانوني لحساب المواريث في الجزائر؟',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'يتم حساب المواريث في الجزائر وفقاً للمواد من 126 إلى 183 من قانون الأسرة الجزائري (الأمر رقم 84-11)، والمستمدة من أحكام الشريعة الإسلامية والفقه المالكي.'
          }
        },
        {
          '@type': 'Question',
          'name': 'ما هي الوصية الواجبة في قانون الأسرة الجزائري؟',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'تنص المادة 169 وما بعدها من قانون الأسرة الجزائري على الوصية الواجبة لصالح الأحفاد من الابن أو البنت الذين توفوا قبل مورثهم، بشرط ألا يتجاوز ذلك ثلث التركة.'
          }
        },
        {
          '@type': 'Question',
          'name': 'ما المقصود بالمناسخات في التركات؟',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'المناسخات هي وفاة وارث أو أكثر قبل قسمة التركة الأولى، مما يستوجب دمج وتصحيح عدة مسائل ميت متتابع لتوزيع الأنصبة على الورثة الأحياء النهائيين.'
          }
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'كيفية حساب الميراث الشرعي باستخدام منصة مواريث',
      'description': 'دليل مبسط لاستخدام حاسبة المواريث الرقمية لحساب الفرائض وتقسيم التركات.',
      'step': [
        {
          '@type': 'HowToStep',
          'name': 'تحديد بيانات المتوفى والتركة',
          'text': 'ابدأ بإدخال جنس المتوفى واسمه، وتحديد قيمة التركة الإجمالية بالعملة المحلية مع إدخال مصاريف التجهيز والديون والوصايا لتصفيتها أولاً.',
          'url': `${SITE_URL}/#step1`
        },
        {
          '@type': 'HowToStep',
          'name': 'إضافة الورثة والأقارب',
          'text': 'حدد فروع وأصول وحواشي المتوفى (مثل الأولاد، الوالدين، الإخوة، الزوج أو الزوجة) مع إمكانية تحديد ما إذا كان أي منهم متوفى سابقاً لتفعيل حساب المناسخات أو الوصية الواجبة.',
          'url': `${SITE_URL}/#step2`
        },
        {
          '@type': 'HowToStep',
          'name': 'التحليل والحساب الشرعي',
          'text': 'يقوم النظام بحساب المسألة تلقائياً وإجراء عمليات العول أو الرد والوصية الواجبة وعرض جدول الورثة والأنصبة الإرثية بالأسهم والنسبة المئوية والكسور والمبالغ المالية بالتفصيل.',
          'url': `${SITE_URL}/#step3`
        }
      ]
    }
  ];

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-TileColor" content="#1F3D2E" />
        <meta name="msapplication-TileImage" content="/icons/mstile-150x150.png" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-cairo" suppressHydrationWarning>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
        >
          تخطى إلى المحتوى الرئيسي
        </a>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
