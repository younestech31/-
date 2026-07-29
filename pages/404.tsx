import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
      <div className="text-center p-8 bg-white rounded-xl shadow-md border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">404 - الصفحة غير موجودة</h1>
        <p className="text-slate-600 mb-4">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        <Link href="/" className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">العودة للرئيسية</Link>
      </div>
    </div>
  );
}
