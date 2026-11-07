'use client';

import { X, AlertTriangle, Check } from 'lucide-react';

interface ExcludedHeirWarning {
  heirId: string;
  heirNameAr: string;
  reason: string;
  source?: string;
}

interface MunasakhatExclusionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: ExcludedHeirWarning[];
  acknowledgedExclusions: string[];
  onAcknowledge: (heirId: string) => void;
}

export default function MunasakhatExclusionWarningModal({
  isOpen,
  onClose,
  warnings,
  acknowledgedExclusions,
  onAcknowledge,
}: MunasakhatExclusionWarningModalProps) {
  if (!isOpen) return null;

  // We only show warnings that haven't been acknowledged yet
  const activeWarnings = warnings.filter(w => !acknowledgedExclusions.includes(w.heirId));

  if (activeWarnings.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in-95 duration-200" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-amber-50 shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={20} className="text-amber-600" />
            <h3 className="font-bold text-sm">تنبيه: صلة قرابة تحتاج إلى مراجعة في المناسخة</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 bg-white flex-grow">
          <p className="text-xs text-[#334155] mb-4 leading-relaxed">
            لا يستطيع النظام حسم أهلية شخص بعينه من فئة القرابة وحدها. تحقق من هويته، وحالته وقت وفاة صاحب هذه التركة، وصلته التفصيلية، وما إذا كان هو ذات الوارث المتوفى في مرحلة سابقة.
            إذا لم يكن مستحقاً فأزله من قائمة الورثة؛ وإذا ثبتت أهليته فأكد إدراجه. هذا التنبيه ليس حكماً شرعياً نهائياً:
          </p>

          <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
            {activeWarnings.map((warning) => (
              <div 
                key={warning.heirId} 
                className="p-3.5 border border-amber-200 bg-amber-50/40 rounded-lg flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-xs text-[#0f172a] block">
                      {warning.heirNameAr}
                    </span>
                    <span className="text-[11px] text-amber-700 leading-normal block mt-1">
                      {warning.reason}
                    </span>
                    {warning.source && (
                      <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                        ملاحظة مرجعية للمراجعة فقط: {warning.source}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onAcknowledge(warning.heirId)}
                  className="mt-1 flex items-center justify-center gap-1.5 w-full bg-[#0a5d38] hover:bg-[#084e2e] text-white py-1.5 px-3 rounded-md text-[11px] font-bold transition-all shadow-sm"
                >
                  <Check size={13} />
                  <span>تمت مراجعة هذه الحالة وإدراجها في الحساب (مع منع التصدير الرسمي عند الحاجة)</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#e2e8f0] pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
