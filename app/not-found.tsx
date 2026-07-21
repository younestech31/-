import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowRight, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-cairo" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center flex flex-col items-center">
        {/* Logo / Header Branding */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
          <Image
            src="/logo/logo-stacked-color.svg"
            alt="مواريث"
            width={120}
            height={120}
            className="w-24 h-24 object-contain"
            priority
          />
        </div>

        {/* 404 Status Badge */}
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 mb-4">
          <ShieldAlert size={14} className="text-amber-600" />
          <span>الرمز 404 — الصفحة غير موجودة</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#1F3D2E] font-amiri mb-2">
          عذراً، الرابط المطلوب غير متوفر
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          يبدو أن الصفحة التي تحاول الوصول إليها قد تم نقلها أو حذفها، أو أن المسار المدخل غير صحيح. يمكنك العودة إلى حاسبة المواريث الرئيسية.
        </p>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1F3D2E] hover:bg-[#162e22] text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-950/10 active:scale-98"
          >
            <Home size={16} />
            <span>الرئيسية (الحاسبة)</span>
          </Link>
          <Link
            href="/fr"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            <span>Version Française</span>
            <ArrowRight size={14} className="rotate-180" />
          </Link>
        </div>

        {/* Legal Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          منصة مواريث الرقمية — الديوان العمومي للتوثيق
        </div>
      </div>
    </div>
  );
}
