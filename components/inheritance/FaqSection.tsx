import { FAQ_ITEMS } from '@/data/faq';

export default function FaqSection() {
  const faqs = FAQ_ITEMS;

  return (
    <section className="bg-slate-50 py-12 px-4 border-t border-slate-200" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1F3D2E] font-amiri mb-2">
            الأسئلة الشائعة حول المواريث والفرائض
          </h2>
          <p className="text-gray-600 text-sm md:text-base font-sans">
            إجابات قانونية وشرعية معتمدة وفقاً لأحكام قانون الأسرة الجزائري.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white rounded-xl border border-slate-200 p-4 transition-all duration-200 [&[open]]:shadow-sm"
            >
              <summary className="font-bold text-[#1F3D2E] text-base md:text-lg cursor-pointer list-none flex justify-between items-center select-none font-sans">
                <span>{faq.question}</span>
                <span className="text-emerald-700 font-bold text-xl group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-gray-700 text-sm leading-relaxed border-t border-slate-100 pt-3 font-sans">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
