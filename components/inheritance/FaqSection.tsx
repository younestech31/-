export default function FaqSection() {
  const faqs = [
    {
      question: 'ما هو الأساس القانوني لحساب المواريث في الجزائر؟',
      answer:
        'يتم حساب المواريث في الجزائر وفقاً للمواد من 126 إلى 183 من قانون الأسرة الجزائري (الأمر رقم 84-11)، والمستمدة من أحكام الشريعة الإسلامية والفقه المالكي.',
    },
    {
      question: 'ما هي الوصية الواجبة في قانون الأسرة الجزائري؟',
      answer:
        'تنص المادة 169 وما بعدها من قانون الأسرة الجزائري على الوصية الواجبة لصالح الأحفاد من الابن أو البنت الذين توفوا قبل مورثهم، بشرط ألا يتجاوز ذلك ثلث التركة.',
    },
    {
      question: 'ما المقصود بالمناسخات في التركات؟',
      answer:
        'المناسخات هي وفاة وارث أو أكثر قبل قسمة التركة الأولى، مما يستوجب دمج وتصحيح عدة مسائل ميت متتابع لتوزيع الأنصبة على الورثة الأحياء النهائيين.',
    },
  ];

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
