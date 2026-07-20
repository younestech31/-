import { useState, useEffect } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { OfficeSettings } from '@/lib/inheritance/document-branding';

interface OfficeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OfficeSettings;
  onSave: (settings: OfficeSettings) => void;
  onReset: () => void;
}

export default function OfficeSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onReset
}: OfficeSettingsModalProps) {
  const [notaryNameAr, setNotaryNameAr] = useState(settings.notaryNameAr);
  const [officialDesignationAr, setOfficialDesignationAr] = useState(settings.officialDesignationAr);
  const [titleAr, setTitleAr] = useState(settings.titleAr);
  const [addressAr, setAddressAr] = useState(settings.addressAr);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);

  // Sync state with props when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setNotaryNameAr(settings.notaryNameAr);
      setOfficialDesignationAr(settings.officialDesignationAr);
      setTitleAr(settings.titleAr);
      setAddressAr(settings.addressAr);
      setPhone(settings.phone);
      setEmail(settings.email);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      notaryNameAr: notaryNameAr.trim(),
      officialDesignationAr: officialDesignationAr.trim(),
      titleAr: titleAr.trim(),
      addressAr: addressAr.trim(),
      phone: phone.trim(),
      email: email.trim()
    });
    onClose();
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من رغبتك في استعادة الإعدادات الافتراضية للموثق (الأستاذ لعطب محمد)؟')) {
      onReset();
      onClose();
    }
  };

  const isValid = notaryNameAr.trim() && addressAr.trim();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#cbd5e1]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-slate-50">
          <div className="flex items-center gap-2 text-[#0a5d38]">
            <Settings size={20} className="animate-spin-slow text-[#c5a059]" />
            <h3 className="font-bold text-lg text-[#1e293b]" id="settings-modal-title">إعدادات مكتب التوثيق والترويسة</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors p-1 rounded-full hover:bg-slate-200" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          <p className="text-xs text-[#64748b] leading-relaxed mb-4">
            تتيح لك هذه الإعدادات تخصيص إسم الموثق والعنوان والبيانات الرسمية على جميع المستندات المصدرة (PDF و Word و Excel). سيتم حفظ هذه التغييرات في متصفحك بشكل دائم لتتمكن من استخدامها في كل زيارة.
          </p>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Notary Name */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">إسم الموثق أو الموثقة (بالعربية) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={notaryNameAr}
                onChange={e => setNotaryNameAr(e.target.value)}
                placeholder="مثال: الأستاذ لعطب محمد"
                className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38] font-semibold text-[#1e293b]"
              />
            </div>

            {/* Official Designation */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">الصفة الرسمية للمكتب بالعربية</label>
              <input
                type="text"
                value={officialDesignationAr}
                onChange={e => setOfficialDesignationAr(e.target.value)}
                placeholder="مثال: الديوان العمومي للتوثيق"
                className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38]"
              />
            </div>

            {/* Title / Jurisdiction */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">عنوان الاختصاص القضائي بالعربية</label>
              <input
                type="text"
                value={titleAr}
                onChange={e => setTitleAr(e.target.value)}
                placeholder="مثال: موثق لدى محكمة فلاوسن — ولاية وهران"
                className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38]"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">عنوان المكتب الفعلي <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={addressAr}
                onChange={e => setAddressAr(e.target.value)}
                placeholder="مثال: حي العقيد لطفي، وهران"
                className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38]"
              />
            </div>

            {/* Phone and Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: +213 562 29 69 81"
                  className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38] text-left"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="مثال: mail@example.com"
                  className="w-full p-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38] text-left"
                  dir="ltr"
                />
              </div>
            </div>

          </div>

          {/* Mawarith Brand Reminder */}
          <div className="mt-6 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-start gap-2.5">
            <span className="text-emerald-700 font-bold text-lg leading-none mt-0.5">✨</span>
            <div>
              <h4 className="text-xs font-bold text-[#0a5d38] mb-0.5">منصة مواريث الرقمية</h4>
              <p className="text-[10.5px] text-emerald-800 leading-relaxed">
                تقديراً للجهود، سيتم تضمين علامة التوثيق الرقمية وبوابة <strong>«مواريث» (mawarith.dz)</strong> بشكل رسمي في تذييل المستندات المصدرة لحفظ موثوقية الحسابات.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#e2e8f0] flex flex-row justify-between items-center">
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="استعادة البيانات الافتراضية"
          >
            <RotateCcw size={14} />
            <span>استعادة الافتراضي</span>
          </button>

          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-[#475569] hover:bg-slate-200 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave} 
              disabled={!isValid}
              className="px-5 py-2 text-xs font-bold bg-[#0a5d38] hover:bg-[#07472a] text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              حفظ التغييرات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
