'use client';

import React, { memo, useMemo } from 'react';
import { Info, Maximize2, Minimize2 } from 'lucide-react';
import Fraction from 'fraction.js';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { CalculationResult } from '@/lib/inheritance-calculator';
import { INHERITANCE_BARS } from '@/data/inheritance-bars';
import { MunasakhatStage } from './InheritanceCalculator';
import { formatDZDAmount } from '@/lib/inheritance/document-branding';

const FamilyTree = dynamic(() => import('./FamilyTree/FamilyTree'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-[#0a5d38] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748b]">جاري تحميل مخطط شجرة العائلة...</p>
      </div>
    </div>
  ),
});

export interface ExcludedHeirWarning {
  heirId: string;
  heirNameAr: string;
  reason: string;
  source?: string;
}

export interface StageResult {
  stage: MunasakhatStage;
  results: CalculationResult[];
  netEstate: number;
  noHeirsRedistribution?: {
    policy: 'treasury';
    amount: number;
    messageAr: string;
    redistributeTo?: CalculationResult[];
  } | null;
  excludedHeirWarnings?: ExcludedHeirWarning[];
  hasUnverifiedOverride?: boolean;
}

interface ResultsTableProps {
  isEstatePanelOpen: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  viewMode: 'summary' | 'table' | 'tree' | 'steps';
  setViewMode: (m: 'summary' | 'table' | 'tree' | 'steps') => void;
  currentStageIndex: number;
  setCurrentStageIndex: (i: number) => void;
  munasakhatStages: MunasakhatStage[];
  currentStage: MunasakhatStage;
  currentNetEstate: number;
  results: CalculationResult[];
  problemBase: number | null;
  allStagesResults: StageResult[];
  addMunasakhatStage: (name: string, amount: number, heirId: string, index: number) => void;
  removeStage: (index: number) => void;
  setSelectedHeirExplanation: (r: CalculationResult | null) => void;
  updateImpediment: (heirId: string, index: number, isImpeded: boolean, reasonId?: string) => void;
  /** نتائج فحص استبعادات المناسخة غير المؤكدة في المرحلة الحالية */
  currentStageValidation?: {
    hasUnacknowledgedExclusions?: boolean;
    unacknowledgedExclusions?: ExcludedHeirWarning[];
  };
  /** سياسة توزيع الحصة عند غياب الورثة في المسألة الثانوية */
  noHeirsRedistribution: StageResult['noHeirsRedistribution'];
  isCalculating: boolean;
  handleCopyFullSummary?: () => void;
  estate: number;
  className?: string;
}

const ResultsTable = memo(function ResultsTable({
  isEstatePanelOpen,
  isExpanded,
  onToggleExpand,
  viewMode,
  setViewMode,
  currentStageIndex,
  setCurrentStageIndex,
  munasakhatStages,
  currentStage,
  currentNetEstate,
  results,
  problemBase,
  allStagesResults,
  addMunasakhatStage,
  removeStage,
  setSelectedHeirExplanation,
  updateImpediment,
  currentStageValidation,
  noHeirsRedistribution: _noHeirsRedistribution,
  isCalculating,
  handleCopyFullSummary,
  estate,
  className,
}: ResultsTableProps) {
  const isPureSharesMode = estate === 0;

  return (
    <div
      data-panel="results"
      className={`bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden transition-all duration-300 ${
        isExpanded
          ? 'fixed top-[135px] md:top-[85px] inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 z-40 bg-white rounded-xl shadow-2xl border-2 border-[#0a5d38] flex flex-col h-[calc(100vh-143px)] md:h-[calc(100vh-95px)]'
          : isEstatePanelOpen ? 'lg:col-start-3 lg:row-start-1 min-h-0 lg:h-full' : 'lg:col-start-2 lg:row-start-2 min-h-0 lg:h-full'
      } ${isCalculating ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}
    >
      {/* ── Panel header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] bg-[#fdfdfd] flex items-center justify-between shrink-0">
        {/* Stage tabs / selector */}
        <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 no-print`}>
          {munasakhatStages.length <= 3 ? (
            munasakhatStages.map((stage, idx) => (
              <div key={`${stage.id}-${idx}`} className="flex items-center shrink-0">
                <button
                  onClick={() => setCurrentStageIndex(idx)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    currentStageIndex === idx
                      ? 'bg-[#0a5d38] text-white border-[#0a5d38]'
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0a5d38]'
                  }`}
                >
                  {idx === 0 ? 'المسألة الأصلية' : `وفاة: ${stage.deceasedName}`}
                </button>
                {idx > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); removeStage(idx); }}
                    className="ms-1 text-[#ef4444] hover:bg-[#fee2e2] rounded-full p-0.5"
                    title="حذف هذه المرحلة"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {idx < munasakhatStages.length - 1 && (
                  <span className="mx-1 text-[#cbd5e1]">←</span>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={currentStageIndex}
                onChange={e => setCurrentStageIndex(Number(e.target.value))}
                className="p-1.5 text-xs bg-white border border-[#e2e8f0] rounded-md focus:ring-1 focus:ring-[#0a5d38] outline-none"
              >
                {munasakhatStages.map((stage, idx) => (
                  <option key={`${stage.id}-${idx}`} value={idx}>
                    {idx === 0 ? 'المسألة الأصلية' : `${idx}. وفاة: ${stage.deceasedName}`}
                  </option>
                ))}
              </select>
              {currentStageIndex > 0 && (
                <button
                  onClick={() => removeStage(currentStageIndex)}
                  className="px-2 py-1 text-[10px] text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                >
                  حذف المرحلة الحالية
                </button>
              )}
              <span className="text-[10px] text-[#94a3b8]">({munasakhatStages.length} مراحل)</span>
            </div>
          )}
        </div>


        {/* View mode toggle */}
        <div className={`flex bg-[#f1f5f9] rounded-md p-0.5 shrink-0 ms-2 no-print`}>
          {allStagesResults.length > 1 ? (
            <button
              onClick={handleCopyFullSummary}
              className={`px-3 py-1 text-xs rounded-sm transition-colors text-[#0a5d38] font-bold hover:bg-[#0a5d38]/10 flex items-center gap-1`}
              title="نسخ الملخص الكامل لجميع مراحل المناسخات"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>نسخ الملخص</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                const lines = [
                  `نتائج التقسيم - ${currentStageIndex === 0 ? 'المسألة الأصلية' : `وفاة: ${currentStage.deceasedName}`}`
                ];
                if (problemBase) lines.push(`أصل المسألة: ${problemBase}`);
                lines.push('--------------------------------------------------');
                results.forEach(r => {
                  const presence = currentStage?.heirPresence?.[r.heirId];
                  const getPct = (frac: Fraction) => {
                    const v = frac.valueOf() * 100;
                    return v % 1 === 0 ? `${v}%` : `${v.toFixed(2)}%`;
                  };
                  if (r.count > 1) {
                    for (let i=0; i<r.count; i++) {
                      const customName = presence?.customNames?.[i];
                      const baseName = `${r.nameAr} ${i + 1}`;
                      const displayName = customName ? `${customName} (${r.nameAr})` : baseName;
                      const individualAmt = r.amount / r.count;
                      const indShareFrac = r.shareFraction.div(r.count);
                      const pctStr = r.isBlocked ? '0%' : getPct(indShareFrac);
                      if (isPureSharesMode) {
                        lines.push(`${displayName}: ${r.isBlocked ? 'محجوب' : r.share} - النسبة: ${pctStr}`);
                      } else {
                        lines.push(`${displayName}: ${r.isBlocked ? 'محجوب' : r.share} - المبلغ: ${formatDZDAmount(individualAmt, 'western', true)} (${pctStr})`);
                      }
                    }
                  } else {
                    const pctStr = r.isBlocked ? '0%' : getPct(r.shareFraction);
                    if (isPureSharesMode) {
                      lines.push(`${r.nameAr}: ${r.isBlocked ? 'محجوب' : r.share} - النسبة: ${pctStr}`);
                    } else {
                      lines.push(`${r.nameAr}: ${r.isBlocked ? 'محجوب' : r.share} - المبلغ: ${formatDZDAmount(r.amount, 'western', true)} (${pctStr})`);
                    }
                  }
                });
                try {
                  await navigator.clipboard.writeText(lines.join('\n'));
                  alert('تم نسخ النتائج كنص بنجاح');
                } catch {
                  alert('فشل نسخ النتائج');
                }
              }}
              className={`px-3 py-1 text-xs rounded-sm transition-colors text-[#64748b] hover:text-[#1a1a1a] flex items-center gap-1`}
              title="نسخ كنص للطباعة القانونية"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span className="hidden sm:inline">نسخ النص</span>
            </button>
          )}
          <div className="w-px h-4 bg-[#cbd5e1] self-center mx-1"></div>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs rounded-sm transition-colors ${
              viewMode === 'table' ? 'bg-white shadow-sm text-[#0a5d38] font-bold' : 'text-[#64748b] hover:text-[#1a1a1a]'
            }`}
          >
            جدول
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-xs rounded-sm transition-colors ${
              viewMode === 'tree' ? 'bg-white shadow-sm text-[#0a5d38] font-bold' : 'text-[#64748b] hover:text-[#1a1a1a]'
            }`}
          >
            شجرة
          </button>
          {onToggleExpand && (
            <>
              <div className="w-px h-4 bg-[#cbd5e1] self-center mx-1"></div>
              <button
                onClick={onToggleExpand}
                className="p-1 text-[#64748b] hover:text-[#0a5d38] hover:bg-white rounded-md transition-colors shrink-0"
                title={isExpanded ? 'تصغير الشاشة' : 'توسيع للشاشة الكاملة'}
                aria-label={isExpanded ? 'تصغير الشاشة' : 'توسيع للشاشة الكاملة'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Panel body ───────────────────────────────────────────────── */}
      <div
        id="results-printable-area"
        role="region"
        aria-live="polite"
        aria-atomic="true"
        aria-label="نتائج حساب الميراث والأنصبة الشرعية"
        className={`p-4 flex-grow min-h-0 print:overflow-visible print:h-auto print:block ${
          viewMode === 'tree' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        {currentStageIndex > 0 && currentNetEstate === 0 && !isPureSharesMode && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
            <p><strong>تنبيه:</strong> صافي التركة لهذه المرحلة هو صفر. لن يتم حساب أي أنصبة.</p>
          </div>
        )}

        {currentStageValidation?.hasUnacknowledgedExclusions && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 mb-4 bg-rose-50 border-2 border-rose-300 text-rose-950 text-sm rounded-lg shadow-sm"
          >
            <p className="font-bold">النتائج المعروضة مؤقتة: توجد استبعادات لم تُراجع بعد</p>
            <p className="text-xs mt-1 leading-relaxed">
              استُبعدت العناصر التالية من حساب هذه المرحلة وفق قواعد التنبيه الحالية. لا تعتمد على هذه الأنصبة ولا تصدر مستنداً قبل مراجعة صلة كل وارث والتحقق من انطباق القاعدة على الشخص المعني.
            </p>
            <ul className="mt-3 space-y-2">
              {(currentStageValidation.unacknowledgedExclusions || []).map(warning => (
                <li key={warning.heirId} className="border-t border-rose-200 pt-2">
                  <span className="font-bold">{warning.heirNameAr}</span>
                  <span className="block text-xs mt-0.5">{warning.reason}</span>
                  {warning.source && (
                    <span className="block text-[11px] text-rose-800/80 mt-0.5">المرجع المسجل: {warning.source}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {allStagesResults[currentStageIndex]?.hasUnverifiedOverride && (
          <div className="p-4 mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg flex items-start gap-3 shadow-sm no-print">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">تنبيه هام: تم تجاوز استبعاد الميراث يدوياً في هذه المرحلة</p>
              <p className="text-xs text-amber-700 mt-1">
                لقد تم تفعيل خيار تجاوز الاستبعاد التلقائي للوارث في هذه المرحلة يدوياً. هذا التجاوز يعتبر غير معتمد فقهياً/قانونياً وفقاً لقواعد تصفية المناسخات، ولذلك تم حظر إصدار المستندات الرسمية (المصادقة التوثيقية) لهذه القضية.
              </p>
            </div>
          </div>
        )}

        {results.length > 0 ? (
          viewMode === 'table' ? (
            <TableView
              results={results}
              problemBase={problemBase}
              currentStage={currentStage}
              addMunasakhatStage={addMunasakhatStage}
              setSelectedHeirExplanation={setSelectedHeirExplanation}
              updateImpediment={updateImpediment}
              isPureSharesMode={isPureSharesMode}
            />
          ) : (
            <div className="w-full flex-grow h-full min-h-[400px] lg:h-full lg:min-h-0">
              <FamilyTree allStages={allStagesResults} />
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 md:p-10 max-w-md mx-auto my-auto min-h-[350px]">
            {/* Elegant Logo Accent */}
            <div className="mb-6 p-4 rounded-full bg-slate-50 border border-slate-100 shadow-sm animate-pulse">
              <Image
                src="/logo/logo-stacked-color.svg"
                alt="مواريث"
                width={120}
                height={120}
                className="w-20 h-20 md:w-24 md:h-24 object-contain select-none pointer-events-none"
                style={{ width: 'auto', height: 'auto' }}
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Elegant Typography */}
            <h3 className="text-base md:text-lg font-bold text-[#0a5d38] font-amiri mb-2">
              بوابة تقسيم التركات وتوزيع الأنصبة
            </h3>
            
            <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6 font-cairo">
              المنصة بانتظار إدخال الورثة. يرجى البدء باختيار الأقارب والورثة الشرعيين من لوحة <strong className="text-[#0a5d38]">«الورثة»</strong> في المنتصف ليقوم النظام باحتساب وحل المسألة تلقائياً.
            </p>

            {/* Micro instructions / tips */}
            <div className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-right space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>توجيهات سريعة:</span>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                • تأكد أولاً من تحديد جنس المتوفى (ذكر / أنثى) في لوحة التركة لضمان دقة قواعد الحجب والميراث.
              </p>
              <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                • يمكنك النقر على أيقونة الاستفهام <strong className="text-[#0a5d38]">«؟»</strong> أسفل الشاشة لعرض الدليل الاسترشادي المتكامل.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ResultsTable;

// ─────────────────────────────────────────────────────────────────────────────
//  Inner: Table view
// ─────────────────────────────────────────────────────────────────────────────
interface TableViewProps {
  results: CalculationResult[];
  problemBase: number | null;
  currentStage: MunasakhatStage;
  addMunasakhatStage: (name: string, amount: number, heirId: string, index: number) => void;
  setSelectedHeirExplanation: (r: CalculationResult | null) => void;
  updateImpediment: (heirId: string, index: number, isImpeded: boolean, reasonId?: string) => void;
  isPureSharesMode: boolean;
}

const TableView = memo(function TableView({
  results,
  problemBase,
  currentStage,
  addMunasakhatStage,
  setSelectedHeirExplanation,
  updateImpediment,
  isPureSharesMode,
}: TableViewProps) {
  // Get problem base from the first non-bequest, non-blocked result
  const firstValidForBase = useMemo(() => results.find(
    r => !r.isBlocked && r.heirId !== 'mandatory_bequest' && r.heirId !== 'voluntary_bequest'
  ), [results]);
  const problemBaseToDisplay = useMemo(() => firstValidForBase?.problemBase ?? problemBase, [firstValidForBase, problemBase]);

  // Calculation type badge
  const calcType = useMemo(() => results[0]?.calculationType, [results]);

  // Wife plurality notice
  const wifeResult = useMemo(() => results.find(r => r.heirId === 'wife' && !r.isBlocked && r.count > 1), [results]);

  // Validity check
  const inheritableHeirs = useMemo(() => results.filter(
    r => !r.isBlocked && r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest',
  ), [results]);
  const totalSharesFraction = useMemo(() => inheritableHeirs.reduce(
    (sum, r) => sum.add(r.shareFraction),
    new Fraction(0),
  ), [inheritableHeirs]);
  const isInheritanceEmpty = useMemo(() => inheritableHeirs.length === 0, [inheritableHeirs]);
  const isComplete         = useMemo(() => totalSharesFraction.equals(1), [totalSharesFraction]);

  const memoizedRowData = useMemo(() => {
    return results.flatMap((r, idx) => {
      const presence = currentStage?.heirPresence?.[r.heirId];
      const items = [];
      for (let i = 0; i < r.count; i++) {
        const customName     = presence?.customNames?.[i];
        const baseName       = r.count > 1 ? `${r.nameAr} ${i + 1}` : r.nameAr;
        const displayName    = customName ? `${customName} (${r.nameAr})` : baseName;
        
        const individualResult = r.individuals?.[i];
        const individualAmt  = individualResult ? individualResult.amount : (r.amount / r.count);
        const indIsBlocked   = individualResult ? individualResult.isBlocked : r.isBlocked;
        const indShare       = individualResult ? individualResult.share : r.share;

        const isIndImpeded   = presence?.impededIndexes?.[i] ?? false;
        const indReasonId    = presence?.impedimentReasonIds?.[i];

        const indShareFrac   = individualResult ? individualResult.shareFraction : (r.shareFraction.compare(0) === 0 ? new Fraction(0) : r.shareFraction.div(r.count));
        const percentVal     = indShareFrac.valueOf() * 100;
        const percentStr     = percentVal > 0 ? (percentVal % 1 === 0 ? `${percentVal}%` : `${percentVal.toFixed(2)}%`) : '0%';

        const isInvoluntaryKiller =
          indIsBlocked &&
          (individualResult?.reason?.includes('القاتل خطأ') || indReasonId === 'involuntary_killer');

        items.push({
          key: `${idx}-${i}`,
          r,
          idx,
          i,
          displayName,
          individualResult,
          individualAmt,
          indIsBlocked,
          indShare,
          isIndImpeded,
          indReasonId,
          percentStr,
          isInvoluntaryKiller,
          presence,
        });
      }
      return items;
    });
  }, [results, currentStage?.heirPresence]);

  return (
    <>
      {/* Calc type badge */}
      {calcType && (
        <div
          className={`mb-4 p-3 rounded-md flex items-center justify-center gap-3 border shadow-sm ${
            calcType === 'awl'  ? 'bg-orange-50 border-orange-200 text-orange-800' :
            calcType === 'radd' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                  'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              calcType === 'awl'  ? 'bg-orange-500' :
              calcType === 'radd' ? 'bg-blue-500'   : 'bg-green-500'
            }`}
          />
          <span className="font-bold text-sm">
            {calcType === 'awl'  ? 'عول (م.166): تم زيادة أصل المسألة لاستيعاب جميع الفروض' :
             calcType === 'radd' ? 'رد (م.167): تم توزيع الفائض على أصحاب الفروض نسبياً' :
                                   'مسألة عادية: مجموع الفروض يوافق أصل المسألة'}
          </span>
        </div>
      )}

      {/* Problem base & validity */}
      {problemBaseToDisplay && problemBaseToDisplay > 0 && (
        <div className="mb-4 space-y-2">
          <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-md flex items-center justify-between">
            <span className="font-bold text-[#0a5d38] text-sm">أصل المسألة:</span>
            <span className="font-mono text-lg font-bold bg-[#e2e8f0] px-3 py-1 rounded text-[#1e293b]">
              {problemBaseToDisplay}
            </span>
          </div>
          <div
            className={`p-3 rounded-md flex items-center justify-between ${
              !isInheritanceEmpty && !isComplete
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <span className={`font-bold text-sm ${!isInheritanceEmpty && !isComplete ? 'text-red-800' : 'text-green-800'}`}>
              {isInheritanceEmpty
                ? 'لا يوجد ورثة مستحقون للإرث'
                : isComplete
                ? 'المسألة صحيحة (مجموع السهام = أصل المسألة)'
                : 'المسألة تحتاج تدقيق (مجموع السهام لا يساوي 1)'}
            </span>
            <div
              className={`w-3 h-3 rounded-full ${!isInheritanceEmpty && !isComplete ? 'bg-red-500' : 'bg-green-500'}`}
            />
          </div>
        </div>
      )}

      {/* Wife plurality notice */}
      {wifeResult && (
        <div className="mb-4 p-2.5 bg-blue-50/50 border-r-4 border-blue-400 text-blue-800 text-[11px] rounded-l flex items-center gap-2">
          <Info size={14} className="shrink-0" />
          <p>
            <strong>تنبيه:</strong> نظراً لوجود أكثر من زوجة ({wifeResult.count})، فإنهن يشتركن في نصيب
            الزوجة ({wifeResult.share}) ويقسم بينهن بالتساوي عملاً بالمادة 146.
          </p>
        </div>
      )}

      {/* Problem base summary line above the table */}
      {problemBaseToDisplay && problemBaseToDisplay > 1 && (
        <div className="text-xs text-[#0a5d38] font-semibold mb-2">
          أصل المسألة: {problemBaseToDisplay} سهماً
          {calcType === 'awl' && ' (مسألة عائلة)'}
          {calcType === 'radd' && ' (مسألة ناقصة)'}
        </div>
      )}

      {/* Results table wrapper for horizontal scroll */}
      <div className="w-full overflow-x-auto relative no-scrollbar border border-[#e2e8f0] rounded-xl">
        <table className="w-full border-collapse text-[13px] min-w-[500px]">
          <thead>
            <tr>
              <th className="sticky right-0 bg-[#fdfdfd] z-10 text-right p-2.5 border-b-2 border-[#e2e8f0] text-[#64748b] font-semibold min-w-[130px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">الوارث</th>
              <th className="text-right p-2.5 border-b-2 border-[#e2e8f0] text-[#64748b] font-semibold">النصيب</th>
              {problemBaseToDisplay !== null && problemBaseToDisplay > 0 ? (
                <th className="px-3 py-2 text-center text-xs font-medium text-[#64748b]">
                  السهام
                </th>
              ) : null}
              <th className="text-right p-2.5 border-b-2 border-[#e2e8f0] text-[#64748b] font-semibold">
                {isPureSharesMode ? 'النسبة مئوية' : 'المبلغ المستحق'}
              </th>
              <th className="text-center p-2.5 border-b-2 border-[#e2e8f0] text-[#64748b] font-semibold no-print">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {memoizedRowData.map(({
              key,
              r,
              i,
              displayName,
              individualResult,
              individualAmt,
              indIsBlocked,
              indShare,
              isIndImpeded,
              indReasonId,
              percentStr,
              isInvoluntaryKiller,
              presence,
            }) => (
              <tr key={key} className="hover:bg-[#f8fafc] group">
                {/* Name + reason (sticky column) */}
                <td className="sticky right-0 bg-white group-hover:bg-[#f8fafc] p-2.5 border-b border-[#e2e8f0] min-w-[130px] z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)] transition-colors">
                  <div className={indIsBlocked ? 'text-[#64748b] line-through opacity-70' : ''}>
                    {displayName}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    {individualResult?.reason || r.reason}
                  </div>
                  {i === 0 && r.count > 1 && !isPureSharesMode && (
                    (() => {
                      const activeInd = r.individuals?.find(ind => !ind.isBlocked && ind.amount > 0);
                      const activeAmt = activeInd ? activeInd.amount : 0;
                      return activeAmt > 0 ? (
                        <div className="text-[10px] text-[#0a5d38] mt-0.5 font-bold">
                          نصيب كل واحدة غير محرومة: {formatDZDAmount(activeAmt)}
                        </div>
                      ) : null;
                    })()
                  )}
                </td>

                {/* Share fraction (clickable → explanation modal) */}
                <td
                  className="p-2.5 border-b border-[#e2e8f0] cursor-pointer hover:bg-slate-100/60 transition-colors"
                  dir="ltr"
                  onClick={() => {
                    if (isIndImpeded || indShare === 'محروم') {
                      const bar = indReasonId ? INHERITANCE_BARS.find(b => b.id === indReasonId) : null;
                      const impededReason = bar
                        ? `محروم: ${bar.nameAr} (المادة ${bar.article})`
                        : (individualResult?.reason || r.reason || 'ممنوع من الإرث لوجود مانع شرعي (المادتان 135 و138 من قانون الأسرة). المحروم يعتبر كالمعدوم فلا يرث ولا يحجب غيره.');
                      setSelectedHeirExplanation({
                        ...r,
                        nameAr: displayName,
                        share: 'محروم',
                        isBlocked: true,
                        reason: impededReason,
                        article: bar ? bar.article : (r.article ?? 135),
                        notes: bar ? bar.description : (r.notes || 'موانع الإرث محددة بالمادتين 135 و138 من قانون الأسرة الجزائري. الوارث المحروم لوجود مانع شرعي يمنع من الإرث كلياً ولا يحجب غيره.')
                      });
                    } else if (indIsBlocked) {
                      setSelectedHeirExplanation({
                        ...r,
                        nameAr: displayName,
                        share: 'محجوب',
                        isBlocked: true,
                        reason: individualResult?.reason || r.reason || 'محجوب من الإرث بوجود وارث أقرب درجة',
                        article: r.article ?? 139,
                        notes: r.notes || 'الحجب في الفقه وقانون الأسرة الجزائري (المواد 139-143): المحجوب حجب حرمان لا يستحق شيئاً من التركة لوجود وارث أولى منه.'
                      });
                    } else {
                      setSelectedHeirExplanation({
                        ...r,
                        nameAr: displayName,
                        share: indShare,
                        amount: individualAmt
                      });
                    }
                  }}
                >
                  {isInvoluntaryKiller ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                      يرث المال دون الدية — م.137
                    </span>
                  ) : indIsBlocked ? (
                    indShare === 'محروم' || isIndImpeded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                        محروم
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 border border-gray-200">
                        محجوب
                      </span>
                    )
                  ) : (
                    <span
                      className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-[#f1f5f9] text-[#0a5d38]"
                    >
                      {indShare}
                    </span>
                  )}
                </td>

                {/* Shares column */}
                {problemBaseToDisplay !== null && problemBaseToDisplay > 0 ? (
                  <td className="px-3 py-2 text-center text-sm font-mono">
                    {indIsBlocked || r.shares === 0 ? '—' : (individualResult ? individualResult.shares : r.shares)}
                  </td>
                ) : null}

                {/* Amount / Percentage */}
                <td className="p-2.5 border-b border-[#e2e8f0] font-mono font-medium">
                  {indIsBlocked ? '-' : (isPureSharesMode ? percentStr : `${formatDZDAmount(individualAmt, 'western', true)} (${percentStr})`)}
                </td>

                {/* Actions */}
                <td className="p-2.5 border-b border-[#e2e8f0] text-center no-print">
                  {r.heirId !== 'treasury' &&
                    r.heirId !== 'mandatory_bequest' &&
                    r.heirId !== 'voluntary_bequest' && (
                    <div className="flex flex-col gap-1 items-center">
                      {!indIsBlocked && (
                        <button
                          onClick={() => addMunasakhatStage(displayName, individualAmt, r.heirId, i)}
                          className="text-[10px] bg-[#0a5d38]/10 text-[#0a5d38] px-2 py-1 rounded hover:bg-[#0a5d38] hover:text-white transition-colors"
                          title="إضافة مناسخة (وفاة هذا الوارث)"
                          aria-label={`مناسخة: وفاة ${displayName}`}
                        >
                          وفاة
                        </button>
                      )}

                      {presence && (
                        <div className="flex flex-col items-center">
                          <label
                            className="flex items-center gap-1 text-[10px] cursor-pointer hover:text-[#0a5d38] transition-colors select-none"
                            title="موانع الإرث (القتل، الردة، إلخ)"
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              aria-label={`حرمان الوارث: ${displayName}`}
                              checked={isIndImpeded}
                              onChange={e => {
                                e.stopPropagation();
                                updateImpediment(r.heirId, i, !isIndImpeded, indReasonId);
                              }}
                            />
                            محروم
                          </label>

                          {isIndImpeded && (
                            <select
                              value={indReasonId ?? ''}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                e.stopPropagation();
                                updateImpediment(r.heirId, i, true, e.target.value || undefined);
                              }}
                              className="text-[9px] mt-1 p-0.5 border border-[#e2e8f0] rounded outline-none w-24 bg-white"
                            >
                              <option value="">سبب الحرمان...</option>
                              {INHERITANCE_BARS.map(bar => (
                                <option key={bar.id} value={bar.id}>{bar.nameAr}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Munasakhat note */}
      <div className="mt-4 p-3 bg-[#f0f9ff] rounded border border-[#bae6fd] no-print">
        <p className="text-[11px] text-[#0369a1] leading-relaxed">
          <strong>تنبيه المناسخات:</strong> عند الضغط على &quot;وفاة&quot;، يتم فتح مرحلة جديدة لتقسيم نصيب الوارث
          المتوفى على ورثته الخاصين. يمكنك التنقل بين المراحل من الشريط العلوي.
        </p>
      </div>
    </>
  );
});
