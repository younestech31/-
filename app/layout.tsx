import type { Metadata } from 'next';
import { Cairo, Amiri } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { SITE_URL, OFFICE_INFO } from '@/lib/config';
import type { Viewport } from 'next';
import { FAQ_ITEMS } from '@/data/faq';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
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
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'مواريث — حاسبة المواريث الشرعية',
    description: 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري.',
    url: SITE_URL,
    siteName: 'مواريث',
    locale: 'ar_DZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مواريث — حاسبة المواريث الشرعية',
    description: 'احسب أنصبة الورثة الشرعية بدقة وسهولة وفق أحكام الفرائض وقانون الأسرة الجزائري.',
  },
};

import { headers } from 'next/headers';

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

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
      'mainEntity': FAQ_ITEMS.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
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
          'url': `${SITE_URL}/how-to#step1`
        },
        {
          '@type': 'HowToStep',
          'name': 'إضافة الورثة والأقارب',
          'text': 'حدد فروع وأصول وحواشي المتوفى (مثل الأولاد، الوالدين، الإخوة، الزوج أو الزوجة) مع إمكانية تحديد ما إذا كان أي منهم متوفى سابقاً لتفعيل حساب المناسخات أو الوصية الواجبة.',
          'url': `${SITE_URL}/how-to#step2`
        },
        {
          '@type': 'HowToStep',
          'name': 'التحليل والحساب الشرعي',
          'text': 'يقوم النظام بحساب المسألة تلقائياً وإجراء عمليات العول أو الرد والوصية الواجبة وعرض جدول الورثة والأنصبة الإرثية بالأسهم والنسبة المئوية والكسور والمبالغ المالية بالتفصيل.',
          'url': `${SITE_URL}/how-to#step3`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      'additionalType': 'https://schema.org/Notary',
      'name': `${OFFICE_INFO.officialDesignation} — ${OFFICE_INFO.notaryFullName}`,
      'description': `${OFFICE_INFO.title}. متخصص في حساب المواريث والتركات وفق أحكام قانون الأسرة الجزائري والشريعة الإسلامية.`,
      'url': SITE_URL,
      'telephone': OFFICE_INFO.phone.number,
      'email': OFFICE_INFO.email,
      'areaServed': 'DZ',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Oran',
        'addressRegion': 'Oran Province',
        'addressCountry': 'DZ'
      },
      'knowsAbout': [
        'قانون الأسرة الجزائري',
        'حساب المواريث الشرعية',
        'تقسيم التركات والمقاسمة',
        'المناسخات والوصية الواجبة',
        'توثيق العقود العقارية والفرائض'
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
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
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
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
