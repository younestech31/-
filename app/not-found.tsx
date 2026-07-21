import Link from 'next/link';

const text = {
  ar: {
    title: '404',
    heading: 'الصفحة غير موجودة',
    body: 'ربما تم نقل هذه الصفحة أو حذفها.',
    home: 'العودة للرئيسية',
    calculator: 'حاسبة الأسعار المرجعية',
    blog: 'المدونة القانونية',
  }
} as const;

export default function NotFound() {
  const content = text.ar;

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl" lang="ar">
      <main className="flex-grow flex items-center justify-center pt-32 pb-20">
        <div className="text-center p-8">
          <p className="text-6xl font-bold text-emerald-600 mb-4" aria-hidden="true">{content.title}</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{content.heading}</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{content.body}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition">
              {content.home}
            </Link>
            <Link href="/calculateur-prix-referentiel" className="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition">
              {content.calculator}
            </Link>
            <Link href="/blog" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
              {content.blog}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
