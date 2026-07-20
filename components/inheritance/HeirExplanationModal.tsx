import { X } from 'lucide-react';
import { CalculationResult } from '@/lib/inheritance-calculator';

interface HeirExplanationModalProps {
  selectedHeirExplanation: CalculationResult | null;
  setSelectedHeirExplanation: (explanation: CalculationResult | null) => void;
}

export default function HeirExplanationModal({
  selectedHeirExplanation,
  setSelectedHeirExplanation
}: HeirExplanationModalProps) {
  if (!selectedHeirExplanation) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedHeirExplanation(null)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <h3 className="font-bold text-[#1e293b]">تفاصيل نصيب: {selectedHeirExplanation.nameAr}</h3>
          <button onClick={() => setSelectedHeirExplanation(null)} className="text-[#64748b] hover:text-[#0f172a] transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[60vh] text-sm text-[#475569] leading-relaxed">
          <div className="mb-4">
            <span className="inline-block bg-[#f1f5f9] px-2 py-1 rounded text-[#0f172a] font-medium mb-2 border border-[#e2e8f0]">
              الحالة الحالية: {selectedHeirExplanation.isBlocked ? 'محجوب' : selectedHeirExplanation.share}
            </span>
            <p className="mt-2 text-[#1e293b] font-medium">{selectedHeirExplanation.reason}</p>
          </div>
          {(selectedHeirExplanation.article ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
              <p className="font-bold text-[#0a5d38] mb-1">المادة {selectedHeirExplanation.article} من قانون الأسرة الجزائري</p>
              <p className="text-[13px] bg-[#f8fafc] p-3 rounded-md border border-[#e2e8f0] font-mono leading-loose">{selectedHeirExplanation.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
