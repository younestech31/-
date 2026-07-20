import NextTopLoader from 'nextjs-toploader';
import type { Metadata } from 'next';
import { Cairo, Amiri } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/config';
import type { Viewport } from 'next';

const cairo = Cairo({ 
  subsets: ['arabic'], 
  variable: '--font-cairo',
  adjustFontFallback: false,
  preload: true,
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
  preload: true,
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
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/icons/site.webmanifest" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-TileColor" content="#1F3D2E" />
        <meta name="msapplication-TileImage" content="/icons/mstile-150x150.png" />
      </head>
      <body className="font-cairo" suppressHydrationWarning>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
        >
          تخطى إلى المحتوى الرئيسي
        </a>
        <NextTopLoader 
          color="#1F3D2E"
          showSpinner={false}
          height={3}
        />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
