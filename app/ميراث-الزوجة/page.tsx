import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'ميراث الزوجة في القانون الجزائري — مواريث',
  description: 'تفصيل أحكام ميراث الزوجة أو الزوجات في قانون الأسرة الجزائري والشريعة الإسلامية، والأنصبة الشرعية وحالات الحجب والتقسيم بالتفصيل.',
};

export default function WifeInheritancePage() {
  const pageUrl = `${SITE_URL}/ميراث-الزوجة`;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'كم نصيب الزوجة من ميراث زوجها في القانون الجزائري؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'للزوجة حالتان رئيسيتان في الميراث وفقاً للمادة 146 من قانون الأسرة الجزائري: الربع (1/4) إذا لم يكن للزوج فرع وارث (أولاد أو أولاد ابن)، والثمن (1/8) إذا كان للزوج فرع وارث.'
        }
      },
      {
        '@type': 'Question',
        'name': 'كيف يوزع الميراث في حالة وجود أكثر من زوجة؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'إذا تعددت الزوجات (من اثنتين إلى أربع)، فإنهن يشتركن في نصيب الزوجة الموحد (الربع أو الثمن) ويقسم بينهن بالتساوي، ولا تأخذ كل واحدة منهن نصيباً منفرداً.'
        }
      },
      {
        '@type': 'Question',
        'name': 'هل ترث مطلقة الزوج في القانون الجزائري؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'إذا طلق الزوج زوجته طلاقاً رجعياً وتوفي وهي في العدة، فإنها ترثه. أما المطلقة طلاقاً بائناً فلا ترث إلا في حالة طلاق الفرار (إذا طلقها في مرض الموت بقصد حرمانها وتوفي في ذلك المرض).'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div>
        <header className="bg-[#1F3D2E] text-white py-8 px-4 shadow-md">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-amiri tracking-tight">
                أحكام ميراث الزوجة في قانون الأسرة الجزائري
              </h1>
              <p className="text-xs md:text-sm text-[#B6E0D1] mt-1 font-sans">
                شرح شرعي وقانوني مفصل للأنصبة وحالات التعدد والحجب
              </p>
            </div>
            <Link
              href="/"
              className="text-xs md:text-sm bg-emerald-700/60 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg border border-emerald-500/30 transition-colors font-sans"
            >
              العودة للحاسبة الرئيسية ←
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                نصيب الزوجة من التركة (المادة 146)
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                نص قانون الأسرة الجزائري في المادة 146 على أحكام ميراث الزوجة بوضوح تماشياً مع الشريعة الإسلامية السمحاء. وتستحق الزوجة فرضها المحدد شرعاً بأحد فرضين حسب وجود الفرع الوارث للمتوفى أو عدم وجوده.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                  <h3 className="font-bold text-emerald-800 text-base mb-1">الفرض الأول: الربع (1/4)</h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    تستحق الزوجة الواحدة (أو الزوجات) فرض الربع من تركة الزوج المتوفى إذا لم يكن له فرع وارث مطلقاً (أي لا يوجد أولاد للمتوفى سواء ذكور أو إناث، ولا أولاد ابن وإن نزلوا).
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                  <h3 className="font-bold text-emerald-800 text-base mb-1">الفرض الثاني: الثمن (1/8)</h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    تنزل حصة الزوجة الواحدة (أو الزوجات) إلى الثمن في حالة وجود فرع وارث للمتوفى (ابن، بنت، ابن ابن، بنت ابن وإن نزلوا)، سواء كان هذا الفرع منها أو من زوجة أخرى سابقة.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                حالة تعدد الزوجات في الميراث
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                في حالة جمع المتوفى بين أكثر من زوجة (زوجتين، ثلاث، أو أربع زوجات في ذمته حتى الوفاة)، فإن النصيب المقرر شرعاً وقانوناً (سواء الربع أو الثمن) لا يتضاعف بتعددهن، بل يقسم الفرض كاملاً بينهن بالتساوي.
              </p>
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                <p className="text-xs md:text-sm text-amber-900 leading-relaxed font-medium">
                  مثال تطبيقي: متوفى ترك زوجتين وابناً وتركة قدرها 8,000,000 دج.
                  <br />
                  - فرض الزوجات معاً هو الثمن (1/8) لوجود الفرع الوارث (الابن) = 1,000,000 دج.
                  <br />
                  - يقسم الثمن بالتساوي بين الزوجتين لتأخذ كل واحدة منهما 500,000 دج.
                </p>
              </div>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                الأسئلة الشائعة حول ميراث الزوجة
              </h2>
              <div className="space-y-4">
                {jsonLd.mainEntity.map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-4 last:border-none">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">
                      {faq.name}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {faq.acceptedAnswer.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-gray-500 font-sans">
        منصة مواريث الرقمية — جميع الحقوق محفوظة © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
