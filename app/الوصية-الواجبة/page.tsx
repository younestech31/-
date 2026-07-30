import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'أحكام الوصية الواجبة في القانون الجزائري — مواريث',
  description: 'تفصيل وشرح أحكام الوصية الواجبة وتطبيقاتها في المواد 169 إلى 172 من قانون الأسرة الجزائري، مع شروط الاستحقاق ومقدار الحصة والحل الشرعي.',
};

export default function MandatoryBequestPage() {
  const pageUrl = `${SITE_URL}/الوصية-الواجبة`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'url': pageUrl,
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'ما هي الوصية الواجبة في قانون الأسرة الجزائري؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'الوصية الواجبة هي وصية يفرضها القانون بحكم الشرع للأحفاد (أولاد الابن أو أولاد البنت) الذين توفي والدهم أو والدتهم قبل وفاة الجد أو الجدة أو معهما، ليستحقوا حصة من التركة بشروط محددة.'
        }
      },
      {
        '@type': 'Question',
        'name': 'ما هو أقصى مقدار تستحقه الوصية الواجبة؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'الحد الأقصى للوصية الواجبة هو ثلث التركة (1/3) وفقاً للمادة 169 من قانون الأسرة، على ألا يتجاوز نصيب المستحقين لها نصيب أبيهم أو أمهم لو كان حياً، ولا يتجاوز نصيب أي من أعمامهم أو أخوالهم الورثة.'
        }
      },
      {
        '@type': 'Question',
        'name': 'هل يستحق الأحفاد الوصية الواجبة إذا ترك لهم الجد هبة؟',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'وفقاً للمادة 171 من قانون الأسرة، إذا تصرف الجد أو الجدة للمستحقين بالوصية الواجبة بهبة أو عطاء بلا عوض في حياته، أو أوصى لهم بمال، فإن ذلك يخصم من مقدار الوصية الواجبة المستحقة لهم.'
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
                أحكام الوصية الواجبة في القانون الجزائري
              </h1>
              <p className="text-xs md:text-sm text-[#B6E0D1] mt-1 font-sans">
                دراسة تفصيلية للمواد 169-172 وشروط استحقاق الأحفاد
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
                مفهوم الوصية الواجبة (المادة 169)
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                أقر المشرع الجزائري مبدأ الوصية الواجبة حماية لحقوق الأحفاد الذين توفي والدهم أو والدتهم في حياة الجد أو الجدة. وتعتبر هذه الوصية واجبة بقوة القانون وتنفذ من التركة قبل تقسيمها على الورثة الشرعيين، وذلك تماشياً مع الاجتهاد الفقهي الإسلامي الحديث.
              </p>
              
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-emerald-800 text-base">نص المادة 169 من قانون الأسرة:</h3>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed italic">
                  &quot;من توفي وله أولاد ابن، أو أولاد بنت، وقد مات ذلك الابن أو البنت قبله أو معه، وجبت لهؤلاء الأولاد وصية في ثلث تركته بمقدار حصتهم مما كان يرثه أبوهم أو أمهم عن أصله لو بقي حياً على أن لا يتجاوز ذلك ثلث التركة.&quot;
                </p>
              </div>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                شروط استحقاق الوصية الواجبة
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600 text-xs md:text-sm leading-relaxed">
                <li>
                  <span className="font-bold text-slate-800">وفاة الواسطة:</span> أن يتوفى الابن أو البنت قبل وفاة أصله (الجد/الجدة) أو معه (مثل الموت الجماعي في الحوادث).
                </li>
                <li>
                  <span className="font-bold text-slate-800">عدم الإرث المباشر:</span> ألا يكون الأحفاد وارثين من الجد أو الجدة فرضاً أو تعصيباً (أي أن يحجبهم وارث أقرب كالأبناء الذكور).
                </li>
                <li>
                  <span className="font-bold text-slate-800">حد الثلث:</span> ألا يتجاوز إجمالي حصة أولاد الابن أو البنت ثلث التركة بأي حال من الأحوال.
                </li>
                <li>
                  <span className="font-bold text-slate-800">الموازنة مع الأعمام/الأخوال:</span> ألا تتجاوز حصة الأحفاد حصة أي من أعمامهم أو أخوالهم الورثة لو كانوا أحياء.
                </li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                الخصومات والتبرعات السابقة (المادة 171)
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                إذا كان الجد أو الجدة قد تبرع للأحفاد في حياته بمال بلا عوض (عن طريق الهبة) أو أوصى لهم بوصية اختيارية، فإن هذا القدر يحسب من حصتهم في الوصية الواجبة:
                <br />
                - إذا كان مساوياً لمقدار الوصية الواجبة، سقط حقهم فيها.
                <br />
                - إذا كان أقل، استكملوا ما نقص.
                <br />
                - إذا كان أكثر، اعتبر الزائد وصية اختيارية خاضعة لأحكام الوصايا العامة.
              </p>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                أسئلة شائعة حول الوصية الواجبة
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
