import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  caseName: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  caseName
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-red-50 shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <h3 className="font-bold" id="modal-title">تأكيد الحذف</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors" aria-label="إغلاق"><X size={20} /></button>
        </div>
        
        <div className="p-4 bg-white text-center">
            <p className="text-sm text-[#1e293b] mb-4">
                هل أنت متأكد من حذف مسألة <strong>{caseName}</strong>؟<br/>
                <span className="text-red-500 text-xs mt-2 inline-block">لا يمكن التراجع عن هذا الإجراء.</span>
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
                    className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                >
                    حذف المسألة
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
