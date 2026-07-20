'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Set meta tags manually for client components if needed or rely on metadata */}
      <main className="flex-grow flex items-center justify-center pt-32 pb-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
          <h2 className="text-2xl font-bold text-gray-700 mb-6">حدث خطأ غير متوقع</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.
          </p>
          <button 
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-colors mr-4"
          >
            إعادة تحميل الصفحة
          </button>
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}
