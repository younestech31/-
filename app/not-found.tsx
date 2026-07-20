import { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة | مكتب الأستاذ لعطب محمد - موثق',
  description: 'الصفحة غير موجودة — مكتب الأستاذ لعطب محمد، موثق في وهران. يمكنك العودة للرئيسية أو التواصل معنا للاستفسار عن الإجراءات التوثيقية.',
  robots: {
    index: false,
    follow: false,
  },
};

const text = {
  ar: {
    title: '404',
    heading: 'الصفحة غير موجودة',
    body: 'ربما تم نقل هذه الصفحة أو حذفها.',
    home: 'العودة للرئيسية',
    calculator: 'حاسبة الأسعار المرجعية',
    blog: 'المدونة القانونية',
  },
  fr: {
    title: '404',
    heading: 'Page introuvable',
    body: 'Cette page a été déplacée ou supprimée.',
    home: "Retour à l'accueil",
    calculator: 'Calculateur des prix de référence',
    blog: 'Blog juridique',
  },
} as const;

export default async function NotFound() {
  const lang = ((await headers()).get('x-lang') ?? 'ar') as 'ar' | 'fr';
  const isAr = lang === 'ar';
  const content = text[lang];

  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isAr ? 'rtl' : 'ltr'} lang={lang}>
      <main className="flex-grow flex items-center justify-center pt-32 pb-20">
        <div className="text-center p-8">
          <p className="text-6xl font-bold text-emerald-600 mb-4" aria-hidden="true">{content.title}</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{content.heading}</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{content.body}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isAr ? "/" : "/fr"} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition">
              {content.home}
            </Link>
            <Link href={isAr ? "/calculateur-prix-referentiel" : "/fr/calculateur-prix-referentiel"} className="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition">
              {content.calculator}
            </Link>
            <Link href={isAr ? "/blog" : "/fr/blog"} className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
              {content.blog}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
