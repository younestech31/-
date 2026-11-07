import Link from 'next/link';
import { ShieldCheck, HardDrive, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { PRODUCT_MODES } from '@/lib/config';

export const metadata = {
  title: 'الخصوصية والتخزين المحلي',
  description: 'كيف يحافظ تطبيق مواريث على بيانات المسائل داخل المتصفح.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6 space-y-3">
          <Link href="/" className="inline-flex items-center text-xs text-emerald-400 font-bold hover:underline mb-2 gap-1">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للحاسبة الرئيسية</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-amiri">الخصوصية والتخزين المحلي</h1>
              <p className="text-xs text-slate-400">منصة مواريث الرقمية</p>
            </div>
          </div>
        </header>

        <section className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 text-emerald-400">
            <HardDrive className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">{PRODUCT_MODES.LOCAL.nameAr}</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{PRODUCT_MODES.LOCAL.descriptionAr}</p>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>التشفير المحلي</span>
            </div>
            <p>تُشفر بيانات المسائل المحفوظة بمفتاح يُنشأ على الجهاز وتُخزن في مساحة المتصفح المحلية. لا تتوفر استعادة تلقائية عبر الأجهزة؛ استخدم التصدير والاستيراد اليدوي للاحتفاظ بنسخة احتياطية.</p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">ما الذي يُخزن محلياً؟</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>المسائل المحفوظة وإعدادات المكتب والتدقيق المحلي تبقى داخل تخزين المتصفح.</li>
            <li>ملف الترخيص بعد تفعيله يُخزن على هذا المتصفح ويرتبط بمعرّف تثبيته.</li>
            <li>لا توجد حسابات مستخدمين أو مزامنة ملفات أو قاعدة بيانات مركزية للمسائل.</li>
            <li>إزالة بيانات الموقع أو تغيير المتصفح قد يؤدي إلى فقدان البيانات المحلية ومعرّف التثبيت؛ احتفظ دائماً بنسخة احتياطية من المسائل.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-sm text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-400">
            <KeyRound className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">الترخيص اليدوي</h2>
          </div>
          <p>يُتحقق من توقيع ملف Pro ومدته ومعرّف التثبيت محلياً باستخدام المفتاح العام المضمّن في التطبيق. لا يحتاج هذا الفحص إلى الاتصال بخادم، ولا يُرسل ملف الترخيص أو بيانات المسائل إلى خدمة دفع أو تخزين.</p>
          <Link href="/license" className="inline-flex rounded-lg border border-emerald-700 px-4 py-2 font-semibold text-emerald-300 hover:bg-emerald-950">إدارة الترخيص والتفعيل</Link>
        </section>

        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
          مواريث — الحسابات والبيانات المحفوظة تُدار محلياً في المتصفح.
        </footer>
      </div>
    </div>
  );
}
