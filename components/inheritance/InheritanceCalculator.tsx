'use client';

import { useState, useEffect } from 'react';
import { X, Save, FolderOpen, FilePlus, BookOpen, FileText, Table, FileSignature, FileDown, Home, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useInheritanceState } from '@/lib/hooks/useInheritanceState';
import { HEIRS } from '@/data/heirs';
import EstatePanel    from './EstatePanel';
import HeirsPanel     from './HeirsPanel';
import ResultsTable   from './ResultsTable';
import SaveCaseModal       from './SaveCaseModal';
import SavedCasesModal     from './SavedCasesModal';
import HeirExplanationModal from './HeirExplanationModal';
import ClassicCasesModal   from './ClassicCasesModal';
import ConfirmDeleteModal  from './ConfirmDeleteModal';
import ConfirmResetModal   from './ConfirmResetModal';
import OnboardingGuide     from './OnboardingGuide';
import OfficeSettingsModal from './OfficeSettingsModal';
import { generateFullLegalSummary } from '@/lib/inheritance/legal-summary';

export interface MunasakhatStage {
  id: string;
  deceasedName: string;
  estate: number;
  parentHeirId: string;
  parentStageId: string;
  parentHeirIndex?: number;
  heirPresence: Record<string, import('@/lib/inheritance-calculator').HeirPresence>;
  deceasedSonsCount: number;
  deceasedDaughtersCount: number;
  hasMandatoryBequest: boolean;
  debts?: number;
  funeralCosts?: number;
  bequest?: number;
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
}

import { ClassicCase } from '@/data/classic-cases';
export type { ClassicCase };

export default function InheritanceCalculator() {
  const pathname = usePathname();
  const isFr = pathname ? pathname.startsWith('/fr') : false;
  const homeUrl = isFr ? '/fr' : '/';
  const homeLabel = isFr ? "Retour au site" : "العودة للموقع الرئيسي";

  const state = useInheritanceState();

  const [mobileTab, setMobileTab] = useState<'estate' | 'heirs' | 'results'>('heirs');
  const [isOfficeSettingsOpen, setIsOfficeSettingsOpen] = useState(false);

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
    toggleHeir, updateCount, updateCustomName, updateImpediment,
    addMunasakhatStage, removeStage,
    updateStageName, updateStageMandatoryBequest, updateStageDeceasedChildren, updateStageFinancialField,
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
      <div className="sticky top-0 z-30 flex flex-col shrink-0 no-print shadow-sm md:shadow-none bg-[#f8f9fa]">
        {/* Header */}
        <div className="bg-[#1F3D2E] text-white px-3 md:px-8 py-2 md:py-4 flex flex-col md:flex-row justify-between items-center border-b-4 border-[#B8894A] shrink-0 gap-2.5 md:gap-4 text-center md:text-right">
          <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <Link
              href={homeUrl}
              className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg p-1.5 md:p-2.5 text-xs font-bold transition-all shadow-sm border border-white/5"
              title={homeLabel}
            >
              <Home size={14} className="md:size-[16px]" />
            </Link>
            <div className="text-right flex items-center gap-3">
              <div className="flex flex-col items-center md:items-start text-center md:text-right">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/logo/logo-horizontal-white.svg"
                    alt="مواريث"
                    width={130}
                    height={38}
                    className="h-8 md:h-11 w-auto object-contain select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    priority
                  />
                  <span className="bg-[#B8894A] text-white text-[9px] md:text-[10px] px-2 py-0.5 rounded font-bold tracking-wide shrink-0 self-center">حاسبة شرعية</span>
                </div>
                <p className="text-[9px] md:text-xs text-[#B6E0D1] opacity-90 mt-1 font-medium font-cairo">
                  {isFr ? 'Code de la Famille Algérien' : 'منصة رقمية مساعدة لتصفية التركات وقسمة المواريث'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 md:gap-3 justify-center md:justify-end w-full md:w-auto">
              {/* مجموعة إدارة المسألة: wraps cleanly, equal width flex-1 buttons */}
              <div className="flex flex-wrap items-center gap-2 md:gap-1.5 justify-center bg-white/[0.04] p-1.5 md:p-1.5 rounded-lg md:rounded-xl border border-white/10 shadow-inner w-full md:w-auto">
                <button 
                  onClick={() => setIsConfirmResetOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm border border-white/5" 
                  title="بدء مسألة جديدة"
                >
                  <FilePlus size={13} />
                  <span>جديد</span>
                </button>
                
                {activeCaseId && (
                  <button 
                    onClick={updateSavedCase} 
                    className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-[#B8894A] hover:bg-[#A3783E] text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-md border border-[#B8894A]/30" 
                    title="تحديث نفس المسألة المحفوظة"
                  >
                    <Save size={13} />
                    <span>تحديث</span>
                  </button>
                )}
                
                <button 
                  onClick={() => { setSaveName(activeCaseId ? `${saveName} - نسخة` : ''); setIsSaveModalOpen(true); }} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm border border-white/5"
                  title="حفظ المسألة الحالية"
                >
                  <FolderOpen size={13} className="rotate-90" />
                  <span>حفظ</span>
                </button>
                
                <button 
                  onClick={() => setIsSavedCasesModalOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm border border-white/5"
                  title="عرض الحالات المحفوظة"
                >
                  <FolderOpen size={13} />
                  <span>المحفوظات</span>
                </button>
                
                <button 
                  onClick={() => setIsClassicCasesModalOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm border border-white/5"
                  title="عرض أمثلة من الميراث"
                >
                  <BookOpen size={13} />
                  <span>أمثلة</span>
                </button>

                <button 
                  onClick={() => setIsOfficeSettingsOpen(true)} 
                  className="flex-1 md:flex-none min-w-[70px] md:min-w-0 flex items-center justify-center gap-1 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm border border-[#B8894A]/30"
                  title="تعديل ترويسة وبيانات مكتب التوثيق للمستندات المصدرة"
                >
                  <Settings size={13} className="text-[#D9A85E]" />
                  <span>إعدادات المكتب</span>
                </button>
              </div>

              {/* مجموعة التقارير والتصدير: Horizontal scrolling strip on mobile */}
              <div className="flex items-center gap-2 justify-start md:justify-center overflow-x-auto no-scrollbar whitespace-nowrap bg-white/[0.04] p-1.5 md:p-1.5 rounded-lg md:rounded-xl border border-white/10 shadow-inner w-full md:w-auto max-w-full shrink-0">
                <button 
                  onClick={handleLegalSummary} 
                  disabled={isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تنزيل ملخص نصي قانوني"
                >
                  <FileText size={13} />
                  <span>ملخص قانوني</span>
                </button>
                
                <button 
                  onClick={exportToExcelApplet} 
                  disabled={isExportingExcel || isCalculatorEmpty}
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex items-center gap-1 md:gap-1.5 bg-[#B8894A]/15 hover:bg-[#B8894A]/30 border border-[#B8894A]/40 text-[#D9A85E] hover:text-white rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 h-8 md:h-9 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div suppressHydrationWarning className="text-xs md:text-sm font-bold">{new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

      {/* Mobile Tab Navigation (stuck inside top bar wrapper so that it retains absolute positioning perfectly relative to header) */}
      <div className="lg:hidden shrink-0 px-4 pt-3 pb-1 flex gap-2 bg-[#f8f9fa] border-b border-[#e2e8f0] no-print" dir={isFr ? 'ltr' : 'rtl'}>
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
          <span className="truncate">{isFr ? 'Succession' : 'التركة'}</span>
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
          <span className="truncate">{isFr ? 'Héritiers' : 'الورثة'}</span>
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
          <span className="truncate">{isFr ? 'Résultats' : 'النتائج'}</span>
        </button>
      </div>
      </div>

      <div className="shrink-0">
        {inputWarnings.length > 0 && (
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
        <ClassicCasesModal isOpen={isClassicCasesModalOpen} onClose={() => setIsClassicCasesModalOpen(false)} loadClassicCase={loadClassicCase} />
      </div>

      {estate < 0 ? (
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="bg-red-50 p-8 rounded-lg border-2 border-red-200 text-center max-w-lg shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><X size={32} /></div>
            <h2 className="text-xl font-bold text-red-800 mb-2">خطأ في قيمة التركة</h2>
            <p className="text-red-600 leading-relaxed">القيمة المدخلة للتركة سالبة ({estate.toLocaleString('en-US')})، ولا يمكن إجراء حسابات الميراث على قيم سالبة. يرجى تصحيح المبلغ للمتابعة.</p>
          </div>
        </div>
      ) : (
        <>
          <OnboardingGuide />
          <div className={`grid grid-cols-1 gap-4 p-4 flex-grow min-h-0 lg:h-0 transition-all duration-300 ${isEstatePanelOpen ? 'lg:grid-cols-[260px_1fr_1fr] lg:grid-rows-1' : 'lg:grid-cols-[1fr_1fr] lg:grid-rows-[auto_1fr]'}`}>

          <EstatePanel
            isOpen={isEstatePanelOpen}
            onToggle={() => setIsEstatePanelOpen(!isEstatePanelOpen)}
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            currentNetEstate={currentNetEstate}
            estate={estate} debts={debts} funeralCosts={funeralCosts} bequest={bequest} netEstate={netEstate}
            deceasedGender={deceasedGender} setDeceasedGender={setDeceasedGender}
            setEstate={setEstate} setDebts={setDebts} setFuneralCosts={setFuneralCosts} setBequest={setBequest}
            updateStageName={updateStageName}
            updateStageMandatoryBequest={updateStageMandatoryBequest}
            updateStageDeceasedChildren={updateStageDeceasedChildren}
            updateStageFinancialField={updateStageFinancialField}
            parentHeirName={currentStage.parentHeirId ? HEIRS.find(h => h.id === currentStage.parentHeirId)?.nameAr : undefined}
            className={mobileTab === 'estate' ? 'flex h-full' : 'hidden lg:flex'}
          />

          <HeirsPanel
            isEstatePanelOpen={isEstatePanelOpen}
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            currentGender={currentGender}
            deceasedGender={deceasedGender}
            toggleHeir={toggleHeir} updateCount={updateCount} updateCustomName={updateCustomName}
            className={mobileTab === 'heirs' ? 'flex h-full' : 'hidden lg:flex'}
          />

          <ResultsTable
            isEstatePanelOpen={isEstatePanelOpen}
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
            className={mobileTab === 'results' ? 'flex h-full' : 'hidden lg:flex'}
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
