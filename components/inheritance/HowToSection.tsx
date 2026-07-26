export default function HowToSection() {
  const steps = [
    {
      id: 'step1',
      stepNumber: '1',
      name: 'تحديد بيانات المتوفى والتركة',
      text: 'ابدأ بإدخال جنس المتوفى واسمه، وتحديد قيمة التركة الإجمالية بالعملة المحلية مع إدخال مصاريف التجهيز والديون والوصايا لتصفيتها أولاً.',
    },
    {
      id: 'step2',
      stepNumber: '2',
      name: 'إضافة الورثة والأقارب',
      text: 'حدد فروع وأصول وحواشي المتوفى (مثل الأولاد، الوالدين، الإخوة، الزوج أو الزوجة) مع إمكانية تحديد ما إذا كان أي منهم متوفى سابقاً لتفعيل حساب المناسخات أو الوصية الواجبة.',
    },
    {
      id: 'step3',
      stepNumber: '3',
      name: 'التحليل والحساب الشرعي',
      text: 'يقوم النظام بحساب المسألة تلقائياً وإجراء عمليات العول أو الرد والوصية الواجبة وعرض جدول الورثة والأنصبة الإرثية بالأسهم والنسبة المئوية والكسور والمبالغ المالية بالتفصيل.',
    },
  ];

  return (
    <section className="bg-white py-12 px-4 border-t border-emerald-900/10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1F3D2E] font-amiri mb-2">
            كيفية حساب الميراث الشرعي باستخدام منصة مواريث
          </h2>
          <p className="text-gray-600 text-sm md:text-base font-sans">
            دليل مبسط لاستخدام حاسبة المواريث الرقمية لحساب الفرائض وتقسيم التركات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              id={step.id}
              className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-800/10 relative transition-all duration-200 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#1F3D2E] text-amber-300 font-bold flex items-center justify-center text-lg mb-4">
                {step.stepNumber}
              </div>
              <h3 className="text-lg font-bold text-[#1F3D2E] mb-2 font-sans">
                {step.name}
              </h3>
              <p className="text-gray-700 text-xs md:text-sm leading-relaxed font-sans">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
