'use client';

import dynamic from 'next/dynamic';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="h-14 bg-[#1F3D2E] w-full" />
      <div className="p-4 space-y-4">
        <div className="h-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-32 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="text-center text-slate-500 mt-4 text-base font-medium">جاري التحميل...</div>
    </div>
  );
}

const InheritanceCalculator = dynamic(
  () => import('@/components/inheritance/InheritanceCalculator'),
  { ssr: false, loading: () => <LoadingSkeleton /> }
);

export default function Home() {
  return (
    <>
      {/* Dynamic Client App Wrapper */}
      <InheritanceCalculator />

      {/* SEO & Search Engine Indexing Fallback (No-JS / Server Crawlers) */}
      <noscript>
        <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow mt-10" dir="rtl">
          <h1 className="text-3xl font-bold text-[#1F3D2E] font-amiri">مواريث — حاسبة المواريث الشرعية وتصفية التركات</h1>
          <p className="mt-4 text-gray-700 leading-relaxed font-sans">
            مرحباً بك في المنصة الرقمية المتقدمة لحساب الفرائض والمواريث وفقاً للأمر رقم 84-11 المتعلق بقانون الأسرة الجزائري (المواد بقسم الميراث من م.126 إلى م.183). 
            تتيح هذه الأداة حساب الفرائض والمواريث وفقاً للأمر رقم 84-11 المتعلق بقانون الأسرة الجزائري (المواد من 126 إلى 183). 
            تساعد هذه الأداة في تنظيم الحسابات التقديرية للتركات.
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-6 font-sans">الميزات والقدرات الفنية للتطبيق:</h2>
          <ul className="list-disc list-inside mt-2 space-y-2 text-gray-650 font-sans">
            <li>حساب دقيق لجميع أصناف الورثة: أصحاب الفروض والعصبات وذوي الأرحام تلقائياً.</li>
            <li>معالجة كاملة لمسائل حجب الحرمان وحجب النقصان بالتفصيل مع ذكر المواد القانونية المصاحبة لدعم المصداقية القضائية.</li>
            <li>التصفية الشرعية للتركة من ديون ومصاريف جنازة وتجهيز المتوفى، والوصايا الاختيارية في حدود الثلث الشرعي.</li>
            <li>دعم شامل لـ «الوصية الواجبة» طبقاً للمادة 169 وما بعدها لصالح الأحفاد من الابن المتوفى قبل والده.</li>
            <li>توزيع تلقائي للمناسخات المتعددة والمترابطة (حدوث وفيات متتابعة قبل قسمة التركة الأولى) بطريقة ميسرة ومُفسَّرة.</li>
            <li>تحديث تلقائي لحل المسائل الخاصة بحالات العول الفرضي، والرد الفرضي على أصحاب الفروض عدا الزوجين.</li>
            <li>تصدر نتائج وتفاصيل الحساب الشرعي بلمح البصر بصيغ احترافية: Word و Excel وعرضها لسهولة المراجعة.</li>
          </ul>
          <p className="mt-6 text-xs text-gray-500 font-sans">
            تنبيه: يفخر هذا البرنامج بكونه يعمل في المتصفح محلياً وبشكل آمن 100% دون إرسال أي من بيانات التركات أو أسماء الورثة إلى خوادم خارجية، مما يضمن السرية المطلقة للاستشارات القانونية والوثائق العائلية.
          </p>
        </div>
      </noscript>
    </>
  );
}
