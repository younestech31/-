'use client';

import { useState, useEffect } from 'react';
import { X, Save, FolderOpen, FilePlus, BookOpen, FileText, Table, FileSignature, FileDown, Settings } from 'lucide-react';
import Image from 'next/image';
import { useInheritanceState } from '@/lib/hooks/useInheritanceState';
import { HEIRS } from '@/data/heirs';
import EstatePanel    from './EstatePanel';
import HeirsPanel     from './HeirsPanel';
import ResultsTable   from './ResultsTable';
import SaveCaseModal       from './SaveCaseModal';
import MunasakhatExclusionWarningModal from './MunasakhatExclusionWarningModal';
import SavedCasesModal     from './SavedCasesModal';
import HeirExplanationModal from './HeirExplanationModal';
import ClassicCasesModal   from './ClassicCasesModal';
import ConfirmDeleteModal  from './ConfirmDeleteModal';
import ConfirmResetModal   from './ConfirmResetModal';
import OnboardingGuide     from './OnboardingGuide';
import OfficeSettingsModal from './OfficeSettingsModal';
import { generateFullLegalSummary } from '@/lib/inheritance/legal-summary';
import { formatDZDAmount } from '@/lib/inheritance/document-branding';

export interface MunasakhatStage {
  id: string;
  deceasedName?: string;
  estate?: number;
  parentHeirId?: string;
  deceasedHeirId?: string;
  parentStageId?: string;
  parentHeirIndex?: number;
  heirPresence?: Record<string, import('@/lib/inheritance/inheritance-calculator').HeirPresence>;
  deceasedSonsCount?: number;
  deceasedDaughtersCount?: number;
  deceasedChildren?: import('@/lib/inheritance/inheritance-calculator').DeceasedChildGroup[];
  hasMandatoryBequest: boolean;
  alreadyInheritedFromParentAmount?: number;
  inheritedFromParentAmount?: number;
  ownSeparateAssets?: number;
  debts?: number;
  funeralCosts?: number;
  bequest?: number;
  secondDeceasedHasChildrenFromOtherUnion?: boolean;
  hasChildrenFromOtherUnion?: boolean;
  acknowledgedExclusions?: string[];
  heirs?: import('@/lib/inheritance/inheritance-calculator').HeirPresence[];
}

export interface SavedCase {
  id: string;
  name: string;
  date: string;
  deceasedGender: 'male' | 'female' | null;
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  stages: MunasakhatStage[];
  createdAt?: string;
  updatedAt?: string;
  munasakhatStages?: MunasakhatStage[];
}

import { ClassicCase } from '@/data/classic-cases';
export type { ClassicCase };

export interface InheritanceCalculatorProps {
  classicCasesIntroContent?: React.ReactNode;
  classicCasesExplainers?: Record<string, React.ReactNode>;
  onboardingIntroContent?: React.ReactNode;
}

export default function InheritanceCalculator({
  classicCasesIntroContent,
  classicCasesExplainers,
  onboardingIntroContent
}: InheritanceCalculatorProps) {
  const state = useInheritanceState();

  const [mobileTab, setMobileTab] = useState<'estate' | 'heirs' | 'results'>('heirs');
  const [expandedSection, setExpandedSection] = useState<'estate' | 'heirs' | 'results' | null>(null);
  const [isOfficeSettingsOpen, setIsOfficeSettingsOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
  const [isFirstUseWarningHidden, setIsFirstUseWarningHidden] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('mirath_warning_dismissed_first_use');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsFirstUseWarningHidden(true);
        localStorage.setItem('mirath_warning_dismissed_first_use', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedSection !== null) {
        setExpandedSection(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedSection]);

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const {
    isEstatePanelOpen, setIsEstatePanelOpen,
    viewMode, setViewMode,
    isSavedCasesModalOpen, setIsSavedCasesModalOpen,
    isClassicCasesModalOpen, setIsClassicCasesModalOpen,
    isImporting,
    isSaveModalOpen, setIsSaveModalOpen,
    isConfirmDeleteOpen, setIsConfirmDeleteOpen,
    isConfirmResetOpen, setIsConfirmResetOpen,
    selectedHeirExplanation, setSelectedHeirExplanation,
    saveName, setSaveName,
    storageError,
    activeCaseId,
    caseToDeleteName,
    deceasedGender, setDeceasedGender,
    estate, setEstate,
    debts, setDebts,
    funeralCosts, setFuneralCosts,
    bequest, setBequest,
    netEstate,
    munasakhatStages,
    currentStageIndex, setCurrentStageIndex,
    currentStage,
    currentGender,
    allStagesResults,
    results,
    currentNetEstate,
    problemBase,
    noHeirsRedistribution,
    currentStageValidation,
    inputWarnings,
    savedCases,
    toggleHeir, updateCount, updateCustomName, updateMissingPersonStatus, updateImpediment,
    addMunasakhatStage, removeStage,
    updateStageName, updateStageMandatoryBequest, updateStageDeceasedChildren, updateStageAlreadyInherited, updateStageFinancialField,
    updateStageChildrenFromOtherUnion,
    acknowledgeStageExclusion,
    resetCalculator, saveCurrentCase, updateSavedCase, loadCase,
    deleteCase, confirmDelete, exportData, importData, loadClassicCase, exportToExcelApplet, exportToWordApplet, exportToPDFApplet,
    isExportingPDF, isExportingExcel, isExportingWord, isCalculatorEmpty,
    handleCopyFullSummary,
    isWorkerCalculating,
    toast,
    officeSettings,
    saveOfficeSettings,
    resetOfficeSettings,
  } = state;

  const currentStageResult = allStagesResults?.[currentStageIndex] || allStagesResults?.[0];
  const currentWarnings = currentStageResult?.excludedHeirWarnings || [];
  const acknowledgedExclusions = currentStage?.acknowledgedExclusions || [];
  const activeWarningsCount = currentWarnings.filter(w => !acknowledgedExclusions.includes(w.heirId)).length;

  useEffect(() => {
    if (activeWarningsCount > 0) {
      setIsExclusionModalOpen(true);
    }
  }, [activeWarningsCount]);

  useEffect(() => {
    if (isEstatePanelOpen) {
      setMobileTab('estate');
    } else {
      setMobileTab(prev => prev === 'estate' ? 'heirs' : prev);
    }
  }, [isEstatePanelOpen]);

  const handleLegalSummary = () => {
    const text = generateFullLegalSummary(allStagesResults, {
      estate,
      debts,
      funeralCosts,
      bequest,
      deceasedGender,
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    try {
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ملخص_الميراث_الكامل.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      id="main-calculator-content"
      className="flex flex-col min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden bg-[#f8f9fa] text-[#1a1a1a] font-sans pb-[env(safe-area-inset-bottom)] pb-8 lg:pb-0"
      dir="rtl"
    >

      {/* Sticky Top Bar and Mobile Navigation Wrapper */}
      <div className="sticky top-0 z-50 flex flex-col shrink-0 no-print shadow-sm md:shadow-none bg-[#f8f9fa]">
        {/* Header */}
        <div className="bg-[#1F3D2E] text-white px-3 md:px-6 py-1 flex flex-col md:flex-row justify-between items-center border-b-2 border-[#B8894A] shrink-0 gap-1.5 md:gap-3 text-center md:text-right">
          <div className="flex flex-row items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">

            <div className="text-right flex items-center gap-2.5">
              <div className="flex flex-col items-center md:items-start text-center md:text-right">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/logo/logo-horizontal-white.svg"
                    alt="مواريث"
                    width={180}
                    height={50}
                    className="h-8 md:h-11 w-auto max-w-[160px] md:max-w-[220px] object-contain select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    priority
                    unoptimized
                  />
                  <span className="bg-[#B8894A] text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded font-bold tracking-wide shrink-0 self-center">حاسبة شرعية</span>
                </div>
                <p className="text-[11px] md:text-xs text-[#B6E0D1] opacity-90 font-medium font-cairo">
                  منصة رقمية مساعدة لتصفية التركات وقسمة المواريث
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 md:gap-2.5 justify-center md:justify-end w-full md:w-auto">
              {/* مجموعة إدارة المسألة: wraps cleanly, equal width flex-1 buttons */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-1 justify-center bg-white/[0.04] p-1.5 md:p-1 rounded-lg md:rounded-xl border border-white/10 shadow-inner w-full md:w-auto">
                <button 
                  onClick={() => setIsConfirmResetOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm border border-white/5" 
                  title="بدء مسألة جديدة"
                >
                  <FilePlus size={13} />
                  <span>جديد</span>
                </button>
                
                {activeCaseId && (
                  <button 
                    onClick={updateSavedCase} 
                    className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-[#B8894A] hover:bg-[#A3783E] text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-md border border-[#B8894A]/30" 
                    title="تحديث نفس المسألة المحفوظة"
                  >
                    <Save size={13} />
                    <span>تحديث</span>
                  </button>
                )}
                
                <button 
                  onClick={() => { setSaveName(activeCaseId ? `${saveName} - نسخة` : ''); setIsSaveModalOpen(true); }} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm border border-white/5"
                  title="حفظ المسألة الحالية"
                >
                  <FolderOpen size={13} className="rotate-90" />
                  <span>حفظ</span>
                </button>
                
                <button 
                  onClick={() => setIsSavedCasesModalOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm border border-white/5"
                  title="عرض الحالات المحفوظة"
                >
                  <FolderOpen size={13} />
                  <span>المحفوظات</span>
                </button>
                
                <button 
                  onClick={() => setIsClassicCasesModalOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm border border-white/5"
                  title="عرض أمثلة من الميراث"
                >
                  <BookOpen size={13} />
                  <span>أمثلة</span>
                </button>

                <button 
                  onClick={() => setIsOfficeSettingsOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm border border-[#B8894A]/30"
                  title="تعديل ترويسة وبيانات مكتب التوثيق للمستندات المصدرة"
                >
                  <Settings size={13} className="text-[#D9A85E]" />
                  <span>إعدادات المكتب</span>
                </button>
              </div>

              {/* مجموعة التقارير والتصدير: Horizontal scrolling strip on mobile */}
              <div className="flex items-center gap-2 justify-start md:justify-center overflow-x-auto no-scrollbar whitespace-nowrap bg-white/[0.04] p-1.5 md:p-1 rounded-lg md:rounded-xl border border-white/10 shadow-inner w-full md:w-auto max-w-full shrink-0">
                <button 
                  onClick={handleLegalSummary} 
                  disabled={isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تنزيل ملخص نصي قانوني"
                >
                  <FileText size={13} />
                  <span>ملخص قانوني</span>
                </button>
                
                <button 
                  onClick={exportToExcelApplet} 
                  disabled={isExportingExcel || isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isCalculatorEmpty ? "يرجى إضافة ورثة أولاً للتصدير" : "تصدير النتائج كملف Excel (XLSX)"}
                >
                  {isExportingExcel ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#D9A85E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Table size={13} />
                  )}
                  <span>{isExportingExcel ? 'جاري التصدير...' : 'إكسل'}</span>
                </button>
                
                <button 
                  onClick={exportToWordApplet} 
                  disabled={isExportingWord || isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isCalculatorEmpty ? "يرجى إضافة ورثة أولاً للتصدير" : "تصدير وثيقة رسمية Word (DOCX)"}
                >
                  {isExportingWord ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#D9A85E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileSignature size={13} />
                  )}
                  <span>{isExportingWord ? 'جاري التصدير...' : 'وورد'}</span>
                </button>

                <button 
                  onClick={exportToPDFApplet} 
                  disabled={isExportingPDF || isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-[34px] shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isCalculatorEmpty ? "يرجى إضافة ورثة أولاً للتصدير" : "تصدير وثيقة رسمية PDF"}
                >
                  {isExportingPDF ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#D9A85E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  <span>{isExportingPDF ? 'جاري التصدير...' : 'بي دي إف'}</span>
                </button>
              </div>
            </div>
            <div className="hidden md:block text-center md:text-left border-l border-white/20 pl-4">
              <div className="text-[9px] md:text-[10px] opacity-80">التاريخ</div>
              <div className="text-xs md:text-sm font-bold">{formattedDate}</div>
            </div>
          </div>
        </div>

      {/* Mobile Tab Navigation (stuck inside top bar wrapper so that it retains absolute positioning perfectly relative to header) */}
      <div className="lg:hidden shrink-0 px-4 pt-3 pb-1 flex gap-2 bg-[#f8f9fa] border-b border-[#e2e8f0] no-print" dir="rtl">
        <button
          onClick={() => {
            setMobileTab('estate');
            setIsEstatePanelOpen(true);
          }}
          className={`flex-1 py-1 px-1 text-xs font-bold text-center rounded-lg border transition-all flex items-center justify-center gap-1.5 h-10 ${
            mobileTab === 'estate' && isEstatePanelOpen
              ? 'bg-[#1F3D2E] text-white border-[#1F3D2E] shadow-sm'
              : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-slate-50'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] shrink-0">1</span>
          <span className="truncate">التركة</span>
        </button>
        <button
          onClick={() => {
            setMobileTab('heirs');
            setIsEstatePanelOpen(false);
          }}
          className={`flex-1 py-1 px-1 text-xs font-bold text-center rounded-lg border transition-all flex items-center justify-center gap-1.5 h-10 ${
            mobileTab === 'heirs' && !isEstatePanelOpen
              ? 'bg-[#1F3D2E] text-white border-[#1F3D2E] shadow-sm'
              : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-slate-50'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] shrink-0">2</span>
          <span className="truncate">الورثة</span>
        </button>
        <button
          onClick={() => {
            setMobileTab('results');
            setIsEstatePanelOpen(false);
          }}
          className={`flex-1 py-1 px-1 text-xs font-bold text-center rounded-lg border transition-all flex items-center justify-center gap-1.5 h-10 ${
            mobileTab === 'results' && !isEstatePanelOpen
              ? 'bg-[#1F3D2E] text-white border-[#1F3D2E] shadow-sm'
              : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-slate-50'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] shrink-0">3</span>
          <span className="truncate">النتائج</span>
        </button>
      </div>
      </div>

      <div className="shrink-0">
        {inputWarnings.length > 0 && !isFirstUseWarningHidden && (
          <div className="bg-red-50 text-red-800 p-2.5 md:p-4 mx-4 md:mx-8 mt-2.5 md:mt-4 rounded-xl border border-red-200 text-xs md:text-sm shadow-sm transition-all duration-300">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-red-900">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
              <span className="text-[11px] md:text-xs tracking-wide uppercase font-semibold text-red-500">تنبيه هام</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {inputWarnings.map((w, i) => (
                <li key={i} className="text-red-700 text-[11px] md:text-[13px] leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0">
        <ClassicCasesModal 
          isOpen={isClassicCasesModalOpen} 
          onClose={() => setIsClassicCasesModalOpen(false)} 
          loadClassicCase={loadClassicCase} 
          introContent={classicCasesIntroContent}
          explainers={classicCasesExplainers}
        />
      </div>

      {estate < 0 ? (
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="bg-red-50 p-8 rounded-lg border-2 border-red-200 text-center max-w-lg shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><X size={32} /></div>
            <h2 className="text-xl font-bold text-red-800 mb-2">خطأ في قيمة التركة</h2>
            <p className="text-red-600 leading-relaxed">القيمة المدخلة للتركة سالبة ({formatDZDAmount(estate)})، ولا يمكن إجراء حسابات الميراث على قيم سالبة. يرجى تصحيح المبلغ للمتابعة.</p>
          </div>
        </div>
      ) : (
        <>
          <OnboardingGuide introContent={onboardingIntroContent} />
          <div className={`grid grid-cols-1 gap-4 p-4 flex-grow min-h-0 lg:h-0 transition-all duration-300 ${isEstatePanelOpen ? 'lg:grid-cols-[260px_1fr_1fr] lg:grid-rows-1' : 'lg:grid-cols-[1fr_1fr] lg:grid-rows-[auto_1fr]'}`}>

          <EstatePanel
            isOpen={isEstatePanelOpen}
            onToggle={() => setIsEstatePanelOpen(!isEstatePanelOpen)}
            isExpanded={expandedSection === 'estate'}
            onToggleExpand={() => setExpandedSection(prev => prev === 'estate' ? null : 'estate')}
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            currentNetEstate={currentNetEstate}
            estate={estate} debts={debts} funeralCosts={funeralCosts} bequest={bequest} netEstate={netEstate}
            deceasedGender={deceasedGender} setDeceasedGender={setDeceasedGender}
            setEstate={setEstate} setDebts={setDebts} setFuneralCosts={setFuneralCosts} setBequest={setBequest}
            updateStageName={updateStageName}
            updateStageMandatoryBequest={updateStageMandatoryBequest}
            updateStageDeceasedChildren={updateStageDeceasedChildren}
            updateStageAlreadyInherited={updateStageAlreadyInherited}
            updateStageFinancialField={updateStageFinancialField}
            updateStageChildrenFromOtherUnion={updateStageChildrenFromOtherUnion}
            parentHeirName={currentStage.parentHeirId ? HEIRS.find(h => h.id === currentStage.parentHeirId)?.nameAr : undefined}
            className={expandedSection === 'estate' || mobileTab === 'estate' ? 'flex h-full' : 'hidden lg:flex'}
          />

          <HeirsPanel
            isEstatePanelOpen={isEstatePanelOpen}
            isExpanded={expandedSection === 'heirs'}
            onToggleExpand={() => setExpandedSection(prev => prev === 'heirs' ? null : 'heirs')}
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            currentGender={currentGender}
            deceasedGender={deceasedGender}
            toggleHeir={toggleHeir} updateCount={updateCount} updateCustomName={updateCustomName} updateMissingPersonStatus={updateMissingPersonStatus}
            className={expandedSection === 'heirs' || mobileTab === 'heirs' ? 'flex h-full' : 'hidden lg:flex'}
          />

          <ResultsTable
            isEstatePanelOpen={isEstatePanelOpen}
            isExpanded={expandedSection === 'results'}
            onToggleExpand={() => setExpandedSection(prev => prev === 'results' ? null : 'results')}
            viewMode={viewMode} setViewMode={setViewMode}
            currentStageIndex={currentStageIndex} setCurrentStageIndex={setCurrentStageIndex}
            munasakhatStages={munasakhatStages}
            currentStage={currentStage}
            currentNetEstate={currentNetEstate}
            results={results}
            problemBase={problemBase}
            allStagesResults={allStagesResults}
            addMunasakhatStage={addMunasakhatStage}
            removeStage={removeStage}
            setSelectedHeirExplanation={setSelectedHeirExplanation}
            updateImpediment={updateImpediment}
            currentStageValidation={currentStageValidation}
            noHeirsRedistribution={noHeirsRedistribution}
            isCalculating={isWorkerCalculating}
            handleCopyFullSummary={handleCopyFullSummary}
            estate={estate}
            className={expandedSection === 'results' || mobileTab === 'results' ? 'flex h-full' : 'hidden lg:flex'}
          />
        </div>
      </>
    )}

      <div className={``}>
        <SaveCaseModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} saveName={saveName} setSaveName={setSaveName} onSave={saveCurrentCase} />

        <SavedCasesModal
          isOpen={isSavedCasesModalOpen}
          onClose={() => setIsSavedCasesModalOpen(false)}
          savedCases={savedCases}
          loadCase={loadCase}
          deleteCase={deleteCase}
          storageError={storageError}
          importData={importData}
          exportData={exportData}
          isImporting={isImporting}
        />

        <HeirExplanationModal selectedHeirExplanation={selectedHeirExplanation} setSelectedHeirExplanation={setSelectedHeirExplanation} />

        <ConfirmDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={confirmDelete}
          caseName={caseToDeleteName}
        />
        <ConfirmResetModal
          isOpen={isConfirmResetOpen}
          onClose={() => setIsConfirmResetOpen(false)}
          onConfirm={() => { resetCalculator(); setIsConfirmResetOpen(false); }}
        />

        <OfficeSettingsModal
          isOpen={isOfficeSettingsOpen}
          onClose={() => setIsOfficeSettingsOpen(false)}
          settings={officeSettings}
          onSave={saveOfficeSettings}
          onReset={resetOfficeSettings}
        />

        <MunasakhatExclusionWarningModal
          isOpen={isExclusionModalOpen}
          onClose={() => setIsExclusionModalOpen(false)}
          warnings={currentWarnings}
          acknowledgedExclusions={acknowledgedExclusions}
          onAcknowledge={acknowledgeStageExclusion}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 print:hidden
            ${toast.type === 'success' ? 'bg-[#1F3D2E] text-white' :
              toast.type === 'error'   ? 'bg-red-600 text-white' :
                                         'bg-[#1e40af] text-white'}`}
        >
          <span>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
