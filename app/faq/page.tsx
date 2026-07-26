import type { Metadata } from 'next';
import Link from 'next/link';
import FaqSection from '@/components/inheritance/FaqSection';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة — مواريث',
  description: 'إجابات قانونية وشرعية معتمدة حول حساب المواريث والفرائض وفقاً لأحكام قانون الأسرة الجزائري.',
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" dir="rtl">
      <div>
        <header className="bg-[#1F3D2E] text-white py-6 px-4 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold font-amiri">
              الأسئلة الشائعة حول المواريث والفرائض
            </h1>
            <Link
              href="/"
              className="text-xs md:text-sm bg-emerald-700/60 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors font-sans"
            >
              العودة للحاسبة الرئيسية ←
            </Link>
          </div>
        </header>

        <main className="py-8">
          <FaqSection />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-gray-500 font-sans">
        منصة مواريث الرقمية — جميع الحقوق محفوظة © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
