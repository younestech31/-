'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/error-monitoring';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    const msg = error?.message || String(error);
    if (msg.includes('Loading chunk')) {
      window.location.reload();
      return;
    }
    reportClientError({
      errorMessage: msg,
      componentStack: error.stack,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">حدث خطأ عام بالنظام</h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            عذراً، حدث خطأ غير متوقع أثناء تحميل التطبيق. تم تسجيل المشكلة وسنعمل على حلها.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
