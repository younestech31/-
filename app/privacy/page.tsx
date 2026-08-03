import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HardDrive, Cloud, Lock, ArrowRight } from 'lucide-react';
import { OFFICE_INFO, PRODUCT_MODES } from '@/lib/config';

export const metadata = {
  title: 'سياسة الخصوصية وسرية بيانات التركات',
  description: 'بيان الخصوصية وأساليب التشفير المحلي والسحابي المعمول بها في منصة مواريث للديوان العمومي للتوثيق.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 space-y-3">
          <Link href="/" className="inline-flex items-center text-xs text-emerald-400 font-bold hover:underline mb-2 gap-1">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للحاسبة الرئيسية</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-amiri">سياسة الخصوصية وسرية التركات</h1>
              <p className="text-xs text-slate-400">{OFFICE_INFO.officialDesignation} — {OFFICE_INFO.notaryFullName}</p>
            </div>
          </div>
        </div>

        {/* Product Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Local Mode */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 text-emerald-400">
              <HardDrive className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">{PRODUCT_MODES.LOCAL.nameAr}</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {PRODUCT_MODES.LOCAL.descriptionAr}
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>التشفيـر الذاتي (AES-GCM 256):</span>
              </div>
              <p>
                تُشفر البيانات المحفوظة بمفتاح فريد يُشتق تلقائياً على مستوى كل جهاز بواسطة WebCrypto API وتُخزن المفاتيح داخل IndexedDB محلياً فقط.
              </p>
            </div>
          </div>

          {/* Cloud Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 text-emerald-400">
              <Cloud className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">{PRODUCT_MODES.CLOUD.nameAr}</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {PRODUCT_MODES.CLOUD.descriptionAr}
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>حماية المكاتب الموثقة:</span>
              </div>
              <p>
                تُحفظ الجلسات بواسطة رمكـز JWT الموقعة رقمياً (HS256). البيانات المنقولة في الوضع السحابي تكون مشفرة من جانب العميل بموافقة الموثق.
              </p>
            </div>
          </div>

        </div>

        {/* Detailed Statements */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-lg font-bold text-white font-amiri border-b border-slate-800 pb-2">التزامات السرية القانونية للموثقين</h3>
          
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-emerald-400 text-sm">1. عدم نقل الأسماء أو الأرقام في الوضع المحلي</h4>
            <p>
              عند استخدام الحاسبة في وضعها القياسي (الوضع المحلي)، فإن خوارزميات التصفية والعول والرد والوصية الواجبة وتوليد ملفات Word و Excel تُنفذ كلياً داخل ذاكرة متصفحك. لا يتصل التطبيق بأي خوادم تتبع أو تحليلات إعلانية خارجية.
            </p>

            <h4 className="font-bold text-emerald-400 text-sm">2. حماية بيانات الاعتماد واشتراكات المكاتب</h4>
            <p>
              يتم تخزين كلمات المرور الخاصة بحسابات الموثقين باستخدام خوارزمية التشفير الأحادي bcrypt مع التمليح الفريد. لا تُخزن كلمات المرور كنصوص صريحة تحت أي ظرف.
            </p>

            <h4 className="font-bold text-emerald-400 text-sm">3. الامتثال للسر المهني للتوثيق</h4>
            <p>
              تخضع كافة الاستشارات والمسائل المحسوبة للسر المهني المحدد بموجب أحكام القانون رقم 06-02 المنظم لمهنة التوثيق بالجزائر.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
          منصة مواريث الرقمية — {OFFICE_INFO.officialDesignation}
        </div>

      </div>
    </div>
  );
}
