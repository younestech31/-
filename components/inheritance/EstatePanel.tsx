'use client';

import React, { memo } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { MunasakhatStage } from './InheritanceCalculator';
import { TANZEEL_RULES } from '@/data/tanzeel';
import { formatDZDAmount } from '@/lib/inheritance/document-branding';

interface EstatePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;

  // Stage
  currentStage: MunasakhatStage;
  currentStageIndex: number;
  currentNetEstate: number;

  // Financial values (root stage only)
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  netEstate: number;

  // Gender
  deceasedGender: 'male' | 'female' | null;
  setDeceasedGender: (g: 'male' | 'female') => void;

  // Setters
  setEstate: (v: number) => void;
  setDebts: (v: number) => void;
  setFuneralCosts: (v: number) => void;
  setBequest: (v: number) => void;
  updateStageName: (name: string) => void;
  updateStageMandatoryBequest: (checked: boolean) => void;
  updateStageDeceasedChildren: (field: 'deceasedSonsCount' | 'deceasedDaughtersCount', value: number) => void;
  updateStageAlreadyInherited?: (value: number) => void;
  updateStageFinancialField: (field: 'debts' | 'funeralCosts' | 'bequest' | 'ownSeparateAssets', value: number) => void;
  updateStageChildrenFromOtherUnion?: (checked: boolean) => void;
  updateStageNoDistantKindredConfirmation: (checked: boolean) => void;
  requiresNoDistantKindredConfirmation?: boolean;
  parentHeirName?: string;
}

const EstatePanel = memo(function EstatePanel({
  isOpen,
  onToggle,
  isExpanded,
  onToggleExpand,
  className,
  currentStage,
  currentStageIndex,
  currentNetEstate,
  estate,
  debts,
  funeralCosts,
  bequest,
  netEstate: _netEstate,
  deceasedGender,
  setDeceasedGender,
  setEstate,
  setDebts,
  setFuneralCosts,
  setBequest,
  updateStageName,
  updateStageMandatoryBequest,
  updateStageDeceasedChildren,
  updateStageAlreadyInherited,
  updateStageFinancialField,
  updateStageChildrenFromOtherUnion,
  updateStageNoDistantKindredConfirmation,
  requiresNoDistantKindredConfirmation = false,
  parentHeirName,
}: EstatePanelProps) {
  return (
    <div
      data-panel="estate"
      className={`bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden transition-all duration-300 no-print ${
        isExpanded
          ? 'fixed top-[135px] md:top-[85px] inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 z-40 bg-white rounded-xl shadow-2xl border-2 border-[#0a5d38] flex flex-col h-[calc(100vh-143px)] md:h-[calc(100vh-95px)]'
          : isOpen ? 'lg:h-full' : 'h-[46px] shrink-0 lg:col-span-2'
      } ${className || ''}`}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-[#e2e8f0] bg-[#fdfdfd] flex items-center justify-between shrink-0 cursor-pointer hover:bg-[#f8fafc] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#0a5d38]">بيانات المتوفى والتركة</span>
          {isExpanded && (
            <span className="text-[10px] bg-[#0a5d38] text-white px-2 py-0.5 rounded-full font-bold">
              الشاشة الكاملة
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
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
          <button
            onClick={onToggle}
            className="p-1 text-[#64748b] hover:text-[#0a5d38] hover:bg-slate-100 rounded-md transition-colors"
            title={isOpen || isExpanded ? 'طي اللوحة' : 'فتح اللوحة'}
            aria-label={isOpen || isExpanded ? 'طي اللوحة' : 'فتح اللوحة'}
          >
            {isOpen || isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className={`p-4 overflow-y-auto flex-grow transition-opacity duration-300 h-full ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}
      >
        {/* Deceased name */}
        <div className="mb-4">
          <label className="block text-xs text-[#64748b] mb-1">اسم المتوفى</label>
          {parentHeirName && (
              <div className="text-[10px] text-[#0a5d38] mb-1 font-bold bg-[#f1fcf7] p-1 rounded">
                  المتوفى هو: {parentHeirName} (في المسألة السابقة)
              </div>
          )}
          <input
            type="text"
            value={currentStage.deceasedName || ''}
            onChange={e => updateStageName(e.target.value)}
            className="w-full p-2 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#0a5d38]"
            placeholder={currentStageIndex === 0 ? 'أدخل اسم المتوفى' : 'اسم الوارث المتوفى'}
          />
        </div>

        {/* Estate amount */}
        <div className="mb-4">
          <label className="block text-xs text-[#64748b] mb-1 font-bold text-[#0a5d38]">
            قيمة التركة الإجمالية (دج)
          </label>
          {currentStageIndex === 0 ? (
            <input
              type="number"
              value={estate === 0 ? '' : estate}
              onChange={e => setEstate(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full p-2.5 border rounded font-mono text-lg font-bold focus:outline-none border-[#0a5d38] bg-white text-[#0a5d38]"
              placeholder="0.00"
            />
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="block text-xs font-semibold text-slate-600 mb-1">
                  الموروث من التركة السابقة
                </span>
                <div className="font-mono text-sm font-bold text-slate-700">
                  {formatDZDAmount(currentStage.inheritedFromParentAmount ?? currentStage.alreadyInheritedFromParentAmount ?? currentStage.inheritedAmount ?? (currentStage.estate ?? 0), 'western', true)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a5d38] mb-1">
                  أموال وممتلكات خاصة أخرى للمتوفى الثاني
                </label>
                <input
                  type="number"
                  value={currentStage.ownSeparateAssets === undefined || currentStage.ownSeparateAssets === 0 ? '' : currentStage.ownSeparateAssets}
                  onChange={e => updateStageFinancialField('ownSeparateAssets', e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                  placeholder="0.00"
                />
              </div>

              <div className="bg-emerald-50/80 p-2.5 rounded border border-emerald-200 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800">إجمالي تركة المتوفى الثاني:</span>
                <span className="font-mono text-base font-bold text-emerald-900">
                  {formatDZDAmount((currentStage.inheritedFromParentAmount ?? currentStage.alreadyInheritedFromParentAmount ?? currentStage.inheritedAmount ?? 0) + (currentStage.ownSeparateAssets ?? 0), 'western', true)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Gender selector (root only) */}
        {currentStageIndex === 0 && (
          <div className="mb-4">
            <label className="block text-xs text-[#64748b] mb-2">جنس المتوفى</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDeceasedGender('male')}
                className={`flex-1 p-2 rounded text-sm ${
                  deceasedGender === 'male' ? 'bg-[#0a5d38] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}
              >
                ذكر
              </button>
              <button
                onClick={() => setDeceasedGender('female')}
                className={`flex-1 p-2 rounded text-sm ${
                  deceasedGender === 'female' ? 'bg-[#0a5d38] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}
              >
                أنثى
              </button>
            </div>
          </div>
        )}

        {/* Financial deductions */}
        {currentStageIndex === 0 ? (
          <>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1">الديون العينية</label>
              <input
                type="number"
                value={debts === 0 ? '' : debts}
                onChange={e => setDebts(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1">مصاريف الجنازة</label>
              <input
                type="number"
                value={funeralCosts === 0 ? '' : funeralCosts}
                onChange={e => setFuneralCosts(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1">الوصية (في حدود الثلث)</label>
              <input
                type="number"
                value={bequest === 0 ? '' : bequest}
                onChange={e => setBequest(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1 font-bold text-[#0a5d38]">ديون الوارث المتوفى (خاصة به)</label>
              <input
                type="number"
                value={currentStage.debts === undefined || currentStage.debts === 0 ? '' : currentStage.debts}
                onChange={e => updateStageFinancialField('debts', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1 font-bold text-[#0a5d38]">مصاريف جنازة الوارث المتوفى</label>
              <input
                type="number"
                value={currentStage.funeralCosts === undefined || currentStage.funeralCosts === 0 ? '' : currentStage.funeralCosts}
                onChange={e => updateStageFinancialField('funeralCosts', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#64748b] mb-1 font-bold text-[#0a5d38]">وصية الوارث المتوفى (بحدود الثلث)</label>
              <input
                type="number"
                value={currentStage.bequest === undefined || currentStage.bequest === 0 ? '' : currentStage.bequest}
                onChange={e => updateStageFinancialField('bequest', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full p-2 border border-[#e2e8f0] rounded font-mono text-sm focus:outline-none focus:border-[#0a5d38]"
                placeholder="0"
              />
            </div>
          </>
        )}

        {/* Toggle for other union children (Munasakhat only) */}
        {currentStageIndex > 0 && currentStage.parentHeirId && ['father', 'mother'].includes(currentStage.parentHeirId) && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-emerald-50/40 rounded border border-emerald-100">
            <input
              type="checkbox"
              id="secondDeceasedHasChildrenFromOtherUnion"
              checked={currentStage.secondDeceasedHasChildrenFromOtherUnion || false}
              onChange={e => updateStageChildrenFromOtherUnion?.(e.target.checked)}
              className="w-4 h-4 accent-[#0a5d38] cursor-pointer"
            />
            <label htmlFor="secondDeceasedHasChildrenFromOtherUnion" className="text-xs text-[#1e293b] cursor-pointer font-bold leading-normal">
              المتوفى الثاني له فروع (أبناء) من زواج/اتحاد آخر
            </label>
          </div>
        )}

        {(requiresNoDistantKindredConfirmation || currentStage.confirmedNoDistantKindred === true) && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50/70 p-3">
            <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-amber-950">
              <input
                type="checkbox"
                checked={currentStage.confirmedNoDistantKindred === true}
                onChange={e => updateStageNoDistantKindredConfirmation(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-amber-700"
              />
              <span>
                أؤكد أنني استقصيت عن ذوي الأرحام وفق المادة 168، وتحققت من عدم وجود ذي رحم مستحق لهذه التركة. أعلم أن ترك خانة الوارث فارغة لا يثبت انعدامه.
              </span>
            </label>
            <p className="mt-2 text-[10px] text-amber-800">
              هذا الإقرار شرط إجرائي لبحث أيلولة الباقي وفق المادتين 167 و180، ولا يغني عن التحقق الفعلي من صلات القرابة.
            </p>
          </div>
        )}

        {/* Mandatory bequest toggle */}
        <div className="mb-3 flex items-center gap-2 p-2 bg-[#f8fafc] rounded border border-[#e2e8f0]">
          <input
            type="checkbox"
            id="mandatoryBequest"
            checked={currentStage.hasMandatoryBequest}
            onChange={e => updateStageMandatoryBequest(e.target.checked)}
            className="w-4 h-4 accent-[#0a5d38]"
          />
          <label htmlFor="mandatoryBequest" className="text-xs text-[#1e293b] cursor-pointer font-bold">
            تفعيل الوصية الواجبة (التنزيل)
          </label>
        </div>

        {/* Deceased children inputs (only when mandatory bequest is on) */}
        {currentStage.hasMandatoryBequest && (
          <>
            <div className="mb-3 p-3 bg-[#fffbeb] rounded border border-[#fef3c7]">
              <p className="text-[10px] text-[#92400e] mb-2 font-bold">
                أدخل عدد الأبناء الذين توفوا قبل المتوفى الحالي ولهم أبناء:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#92400e] mb-1">أبناء (ذكور) متوفون</label>
                  <input
                    type="number"
                    min="0"
                    value={currentStage.deceasedSonsCount || ''}
                    onChange={e => updateStageDeceasedChildren('deceasedSonsCount', Number(e.target.value))}
                    className="w-full p-1 text-xs border border-[#fde68a] rounded focus:outline-none focus:border-[#d97706]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#92400e] mb-1">بنات متوفيات</label>
                  <input
                    type="number"
                    min="0"
                    value={currentStage.deceasedDaughtersCount || ''}
                    onChange={e => updateStageDeceasedChildren('deceasedDaughtersCount', Number(e.target.value))}
                    className="w-full p-1 text-xs border border-[#fde68a] rounded focus:outline-none focus:border-[#d97706]"
                  />
                </div>
              </div>
            </div>

            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-semibold text-amber-800 mb-2">شروط الوصية الواجبة (م.169–172)</p>
              <ul className="space-y-1.5">
                {TANZEEL_RULES.conditions.map(cond => (
                  <li key={cond.id} className="flex flex-col gap-1 text-amber-700 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-600 shrink-0">•</span>
                      <span>{cond.conditionAr} (م.{cond.article})</span>
                    </div>
                    {cond.fieldKey && (
                      <div className="mr-5 mt-1">
                        <label className="block text-[10px] text-amber-800 mb-0.5">ما ورثوه من أبيهم/أمهم (إن وجد):</label>
                        <input
                          type="number"
                          min="0"
                          value={currentStage.alreadyInheritedFromParentAmount || ''}
                          onChange={e => updateStageAlreadyInherited?.(Number(e.target.value))}
                          className="w-full p-1 text-xs border border-amber-300 rounded bg-white"
                          placeholder="مبلغ الإرث السابق من الأب/الأم"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-amber-700 font-semibold">
                هذه قائمة مراجعة وليست إثباتاً آلياً لتحقق الشروط. عند وجود أحفاد، يُعلّق حساب التنزيل الآلي إلى أن تتوفر بيانات كل فرع ومستفيد على حدة.
              </p>
            </div>
          </>
        )}

        {/* Net estate summary */}
        {estate === 0 ? (
          <div className="bg-[#f0f9ff] rounded-md p-3.5 mt-3 border border-[#bae6fd] text-center">
            <p className="text-xs text-[#0369a1] font-bold mb-1">وضع حساب الحصص والسهام</p>
            <p className="text-[10px] text-[#0284c7] leading-relaxed">
              يتم الحساب حالياً بشكل نظري لاستخراج أصل المسألة والسهام والأنصبة والنسبة المئوية لكل وارث دون توزيع مبالغ مالية. لإدخال قيمة التركة، يرجى كتابتها في الحقل المخصص أعلاه.
            </p>
          </div>
        ) : (
          <div className="bg-[#f1f5f9] rounded-md p-3 mt-3 border border-[#e2e8f0]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#64748b]">التركة (لهذه المرحلة):</span>
              <span className="font-mono">
                {formatDZDAmount(currentStageIndex === 0 ? estate : (currentStage.estate ?? 0))}
              </span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#64748b]">إجمالي الخصوم:</span>
              <span className="font-mono">
                {formatDZDAmount(currentStageIndex === 0 
                  ? (debts + funeralCosts + bequest) 
                  : ((currentStage.debts || 0) + (currentStage.funeralCosts || 0) + (currentStage.bequest || 0))
                )}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#0a5d38] mt-2 pt-2 border-t border-[#e2e8f0]">
              <span>صافي التركة:</span>
              <span className="font-mono">{formatDZDAmount(Math.max(0, currentNetEstate))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EstatePanel;
