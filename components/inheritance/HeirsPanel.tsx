'use client';

import React, { memo } from 'react';
import FamilyTreeInput from './FamilyTreeInput';
import { MunasakhatStage } from './InheritanceCalculator';

interface HeirsPanelProps {
  isEstatePanelOpen: boolean;
  currentStage: MunasakhatStage;
  currentStageIndex: number;
  currentGender: 'male' | 'female' | null;
  deceasedGender: 'male' | 'female' | null;
  toggleHeir: (heirId: string) => void;
  updateCount: (heirId: string, count: number) => void;
  updateCustomName: (heirId: string, index: number, name: string) => void;
  className?: string;
}

const HeirsPanel = memo(function HeirsPanel({
  isEstatePanelOpen,
  currentStage,
  currentStageIndex,
  currentGender,
  deceasedGender,
  toggleHeir,
  updateCount,
  updateCustomName,
  className,
}: HeirsPanelProps) {
  return (
    <div
      data-panel="heirs"
      className={`bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden transition-all duration-300 min-h-0 lg:h-full no-print ${
        isEstatePanelOpen ? 'lg:col-start-2 lg:row-start-1' : 'lg:col-start-1 lg:row-start-2'
      } ${className || ''}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] bg-[#fdfdfd] flex items-center justify-between shrink-0">
        <span className="text-sm font-bold text-[#0a5d38]">
          تحديد ورثة {currentStage.deceasedName}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eee] ms-1">المواد 126-183</span>
      </div>

      {/* FamilyTreeInput */}
      <div className="flex-grow relative">
        <FamilyTreeInput
          heirPresence={currentStage.heirPresence}
          toggleHeir={toggleHeir}
          updateCount={updateCount}
          updateCustomName={updateCustomName}
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
