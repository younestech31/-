'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clipboard, KeyRound, Upload, XCircle } from 'lucide-react';
import {
  activateLicenseFile,
  getOrCreateInstallationId,
  getStoredLicenseStatus,
  type LicenseStatus,
} from '@/lib/licensing/manual-license';

const LICENSE_PLANS = [
  { days: 30, label: 'شهر واحد', price: 1000 },
  { days: 90, label: 'ثلاثة أشهر', price: 2500 },
  { days: 365, label: 'سنة كاملة', price: 8000 },
] as const;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function LicenseManager() {
  const [installationId, setInstallationId] = useState('');
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(90);
  const [message, setMessage] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const id = getOrCreateInstallationId();
      setInstallationId(id);
      setStatus(await getStoredLicenseStatus());
    } catch {
      setMessage('تعذر الوصول إلى التخزين المحلي. تأكد من فتح الموقع عبر اتصال آمن ومن السماح ببيانات الموقع.');
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const selectedPlan = useMemo(
    () => LICENSE_PLANS.find(plan => plan.days === selectedDays) || LICENSE_PLANS[1],
    [selectedDays],
  );

  const requestMessage = useMemo(() => [
    'السلام عليكم، أرغب في تفعيل مواريث Pro.',
    'الخطة: ' + selectedPlan.label,
    'المدة: ' + selectedPlan.days + ' يوم',
    'السعر التجريبي: ' + selectedPlan.price.toLocaleString('en-US') + ' دج',
    'معرّف التثبيت: ' + (installationId || 'لم يتم إنشاؤه بعد'),
    'يرجى إرسال بيانات التحويل وخطوات التفعيل.',
  ].join('\n'), [selectedPlan, installationId]);

  const handleCopy = async (value: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successText);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setMessage('تعذر النسخ تلقائياً. حدّد النص وانسخه يدوياً.');
    }
  };

  const handleActivate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsActivating(true);
    setMessage('');
    try {
      const verified = await activateLicenseFile(file);
      setStatus(verified);
      setMessage('تم التحقق من ملف الترخيص وتفعيله على هذا المتصفح بنجاح.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تفعيل ملف الترخيص.');
    } finally {
      setIsActivating(false);
      event.target.value = '';
    }
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_MAWARITH_WHATSAPP || '';
  const whatsappUrl = whatsappNumber
    ? 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(requestMessage)
    : '';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800">مواريث</p>
            <h1 className="mt-1 text-2xl font-bold">الترخيص والتفعيل</h1>
            <p className="mt-1 text-sm text-slate-600">إدارة ترخيص Pro محلياً دون تسجيل حساب.</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100">
            <ArrowRight size={16} />
            العودة للحاسبة
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 text-emerald-700" size={22} />
            <div>
              <h2 className="font-bold">حالة الترخيص على هذا المتصفح</h2>
              {status?.isPaid && status.license ? (
                <div className="mt-2 flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">Pro مفعّل</p>
                    <p>الترخيص: {status.license.licenseId}</p>
                    <p>الاسم: {status.license.customerName}</p>
                    <p>ينتهي في: {formatDate(status.license.expiresAt)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">النسخة المجانية مفعّلة. يمكنك استعمال الحاسبة والحفظ المحلي دون ترخيص.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">معرّف هذا التثبيت</span>
              <button
                type="button"
                onClick={() => void handleCopy(installationId, 'تم نسخ معرّف التثبيت.')}
                disabled={!installationId}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                <Clipboard size={14} />
                نسخ
              </button>
            </div>
            <p className="mt-2 break-all font-mono text-xs text-slate-700" dir="ltr">
              {installationId || 'جارٍ إنشاء معرّف التثبيت…'}
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              أرسل هذا المعرّف عند طلب الترخيص. يُربط ملف الترخيص بهذا المتصفح؛ حذف بيانات الموقع أو استخدام متصفح آخر يستلزم إصدار ترخيص جديد يدوياً.
            </p>
          </div>

          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-800 px-4 py-3 font-bold text-white hover:bg-emerald-900 ${isActivating ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload size={18} />
            {isActivating ? 'جارٍ التحقق من الترخيص…' : 'استيراد ملف الترخيص وتفعيله'}
            <input type="file" accept=".mwlicense,.json,application/json" className="hidden" onChange={handleActivate} disabled={isActivating} />
          </label>

          {message && (
            <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold">طلب تفعيل Pro</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              اختر المدة، ثم أرسل طلبك. يتم تزويدك ببيانات التحويل بشكل مباشر؛ وبعد التأكد من وصول المبلغ فعلياً يصدر ملف الترخيص ويرسل إليك للتفعيل.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {LICENSE_PLANS.map(plan => (
              <button
                key={plan.days}
                type="button"
                onClick={() => setSelectedDays(plan.days)}
                aria-pressed={selectedDays === plan.days}
                className={`rounded-xl border p-4 text-right transition-colors ${selectedDays === plan.days ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-slate-200 hover:border-slate-400'}`}
              >
                <span className="block text-sm font-semibold">{plan.label}</span>
                <span className="mt-2 block text-xl font-bold tabular-nums">{plan.price.toLocaleString('en-US')} دج</span>
                <span className="mt-1 block text-xs text-slate-500">{plan.days} يوماً</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCopy(requestMessage, 'تم نسخ طلب التفعيل. أرسله عبر وسيلة التواصل المناسبة.')}
              className="flex-1 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900"
            >
              <Clipboard size={16} className="ml-2 inline" />
              {isCopied ? 'تم النسخ' : 'نسخ طلب التفعيل'}
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-emerald-700 px-4 py-3 text-center text-sm font-bold text-emerald-800 hover:bg-emerald-50"
              >
                فتح واتساب
              </a>
            )}
          </div>
          <p className="text-xs leading-6 text-slate-500">
            الأسعار تجريبية قابلة للمراجعة. لا يوجد تجديد تلقائي؛ ينتهي الترخيص في التاريخ المحدد ويمكن طلب التجديد يدوياً.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
          <h2 className="font-bold text-slate-900">ما يبقى متاحاً مجاناً؟</h2>
          <p>الحسابات، جميع مسائل المواريث المتاحة في المحرك، الأمثلة، الحفظ المحلي، والاستيراد والتصدير الاحتياطي تبقى متاحة دون اشتراك. ترخيص Pro يزيل العلامة التوضيحية من تقارير PDF.</p>
        </section>

        <footer className="text-center">
          <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">العودة إلى حاسبة مواريث</Link>
        </footer>
      </div>
    </main>
  );
}
