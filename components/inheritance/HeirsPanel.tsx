'use client';

import React, { memo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import FamilyTreeInput from './FamilyTreeInput';
import { MunasakhatStage } from './InheritanceCalculator';

interface HeirsPanelProps {
  isEstatePanelOpen: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  currentStage: MunasakhatStage;
  currentStageIndex: number;
  currentGender: 'male' | 'female' | null;
  deceasedGender: 'male' | 'female' | null;
  toggleHeir: (heirId: string) => void;
  updateCount: (heirId: string, count: number) => void;
  updateCustomName: (heirId: string, index: number, name: string) => void;
  updateMissingPersonStatus?: (heirId: string, status: 'none' | 'missing_presumed_alive') => void;
  className?: string;
}

const HeirsPanel = memo(function HeirsPanel({
  isEstatePanelOpen,
  isExpanded,
  onToggleExpand,
  currentStage,
  currentStageIndex,
  currentGender,
  deceasedGender,
  toggleHeir,
  updateCount,
  updateCustomName,
  updateMissingPersonStatus,
  className,
}: HeirsPanelProps) {
  return (
    <div
      data-panel="heirs"
      className={`bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden transition-all duration-300 no-print ${
        isExpanded
          ? 'fixed top-[135px] md:top-[85px] inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 z-40 bg-white rounded-xl shadow-2xl border-2 border-[#0a5d38] flex flex-col h-[calc(100vh-143px)] md:h-[calc(100vh-95px)]'
          : isEstatePanelOpen ? 'lg:col-start-2 lg:row-start-1 min-h-0 lg:h-full' : 'lg:col-start-1 lg:row-start-2 min-h-0 lg:h-full'
      } ${className || ''}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] bg-[#fdfdfd] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#0a5d38]">
            تحديد ورثة {currentStage.deceasedName}
          </span>
          {isExpanded && (
            <span className="text-[10px] bg-[#0a5d38] text-white px-2 py-0.5 rounded-full font-bold">
              الشاشة الكاملة
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eee] ms-1">المواد 126-183</span>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1 text-[#64748b] hover:text-[#0a5d38] hover:bg-slate-100 rounded-md transition-colors"
              title={isExpanded ? 'تصغير الشاشة' : 'توسيع للشاشة الكاملة'}
              aria-label={isExpanded ? 'تصغير الشاشة' : 'توسيع للشاشة الكاملة'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* FamilyTreeInput */}
      <div className="flex-grow relative">
        <FamilyTreeInput
          heirPresence={currentStage.heirPresence}
          toggleHeir={toggleHeir}
          updateCount={updateCount}
          updateCustomName={updateCustomName}
          updateMissingPersonStatus={updateMissingPersonStatus}
          deceasedGender={currentStageIndex === 0 ? deceasedGender : currentGender}
          deceasedName={currentStage.deceasedName}
          parentHeirId={currentStageIndex > 0 ? currentStage.parentHeirId : undefined}
        />
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 border-t border-[#e2e8f0] bg-[#fdfdfd] shrink-0">
        <div className="text-[11px] text-[#64748b] bg-[#fffbeb] p-2 border border-[#fef3c7] rounded">
          {currentStageIndex > 0
            ? 'الورثة المحاطة بالأحمر مستبعدة فقهياً لارتباطها بالمسألة الأم. يظهر الباقي كورثة مستقلين لهذا المتوفى.'
            : 'ملاحظة: يتم استبعاد الورثة المحجوبين تلقائياً بناءً على قواعد الحجب المنصوص عليها في المادة 159 وما يليها.'
          }
        </div>
      </div>
    </div>
  );
});

export default HeirsPanel;
