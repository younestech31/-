import { Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';

interface SaveCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveName: string;
  setSaveName: Dispatch<SetStateAction<string>>;
  onSave: () => void;
}

export default function SaveCaseModal({
  isOpen,
  onClose,
  saveName,
  setSaveName,
  onSave
}: SaveCaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <h3 className="font-bold text-[#1e293b]" id="modal-title">حفظ المسألة الحالية</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors" aria-label="إغلاق"><X size={20} /></button>
        </div>
        <div className="p-4">
          <label className="block text-sm text-[#475569] mb-2">اسم المسألة (أو إسم المتوفى)</label>
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="مثال: مسألة عائلة بن علي..."
            className="w-full p-2.5 border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0a5d38] focus:ring-1 focus:ring-[#0a5d38]"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') onSave(); }}
          />
        </div>
        <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#e2e8f0] rounded-md transition-colors">إلغاء</button>
          <button 
            onClick={onSave} 
            disabled={!saveName.trim()}
            className="px-4 py-2 text-sm bg-[#0a5d38] text-white rounded-md hover:bg-[#07472a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
