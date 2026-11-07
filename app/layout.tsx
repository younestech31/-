import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';
import { SITE_URL } from '@/lib/config';
import type { Viewport } from 'next';
import { FAQ_ITEMS } from '@/data/faq';

// Self-host fonts so builds never depend on Google Fonts network availability.
const cairo = localFont({
  src: [
    { path: '../public/fonts/cairo-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cairo-bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
});

const amiri = localFont({
  src: [
    { path: '../public/fonts/amiri-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/amiri-bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-amiri',
  display: 'swap',
  preload: false,
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
  authors: [{ name: 'منصة مواريث الرقمية', url: SITE_URL }],
  creator: 'منصة مواريث الرقمية',
  publisher: 'منصة مواريث الرقمية',
  category: 'software',
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
        <Script
          id="json-ld"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Automatic ChunkLoadError / Stale Bundle Recovery */}
        <Script
          id="chunk-error-recovery"
          nonce={nonce}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e && e.message && e.message.indexOf('Loading chunk') !== -1) {
                  console.warn('ChunkLoadError detected, reloading page to fetch fresh bundle...', e);
                  window.location.reload();
                }
              });
            `,
          }}
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
