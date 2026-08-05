'use client';

import { X } from 'lucide-react';
import { CLASSIC_CASES, ClassicCase } from '@/data/classic-cases';

interface ClassicCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadClassicCase: (c: ClassicCase) => void;
  introContent?: React.ReactNode;
  explainers?: Record<string, React.ReactNode>;
}

export default function ClassicCasesModal({
  isOpen,
  onClose,
  loadClassicCase,
  introContent,
  explainers
}: ClassicCasesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-[#e2e8f0]" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-semibold text-[#1e293b] text-base font-sans leading-none">المسائل الفقهية الكلاسيكية الشهيرة</h3>
              <button 
                onClick={onClose} 
                className="p-1 rounded-full text-[#64748b] hover:bg-[#cbd5e1]/30 transition-colors"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
          </div>
          <div className="p-5 overflow-y-auto space-y-3">
             {introContent}
             {CLASSIC_CASES.map((c, i) => (
                 <button 
                     key={i} 
                     onClick={() => loadClassicCase(c)} 
                     className="block w-full text-right p-4 hover:bg-[#f8fafc] rounded-lg border border-[#e2e8f0] transition-all hover:border-[#0a5d38] group active:scale-[0.99]"
                 >
                     <div className="flex justify-between items-center">
                         <span className="font-bold text-sm text-[#1e293b] group-hover:text-[#0a5d38] transition-colors">{c.nameAr}</span>
                         {c.article && (
                             <span className="text-[10px] bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">
                                 المادة {c.article}
                             </span>
                         )}
                     </div>
                     {explainers && explainers[c.id] ? explainers[c.id] : (
                         c.descriptionAr && (
                             <div className="text-[11px] text-[#64748b] mt-1.5 leading-relaxed">
                                 {c.descriptionAr}
                             </div>
                         )
                     )}
                     {c.disputedAr && (
                         <div className="mt-2 text-[11px] p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md font-sans leading-relaxed">
                             {c.disputedAr}
                         </div>
                     )}
                 </button>
             ))}
          </div>
      </div>
    </div>
  );
}
