'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmResetModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmResetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-orange-50 shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle size={20} />
            <h3 className="font-bold">تأكيد بدء مسألة جديدة</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-4 bg-white text-center">
            <p className="text-sm text-[#1e293b] mb-4">
                هل أنت متأكد من مسح جميع بيانات المسألة الحالية والبدء من جديد؟<br/>
                <span className="text-orange-500 text-xs mt-2 inline-block">لن يتم حذف المسائل المحفوظة، لكن البيانات الحالية ستُفقد.</span>
            </p>
            <div className="flex justify-center gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                    إلغاء
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className="px-4 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-md transition-colors"
                >
                    البدء من جديد
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
