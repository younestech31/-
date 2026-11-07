// lib/hooks/useInheritanceState.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CLASSIC_CASES, ClassicCase } from '@/data/classic-cases';
import { generateFullLegalSummary } from '@/lib/inheritance/legal-summary';
import { validateMunasakhatStageExclusions } from '@/data/munasakhat-exclusions';
import { CalculationResult } from '@/lib/inheritance/inheritance-calculator';

import { useMunasakhatStages, INITIAL_STAGES, inferDeceasedGender } from './useMunasakhatStages';
import { useSavedCases } from './useSavedCases';
import { useHeirPresence } from './useHeirPresence';
import { useInheritanceWorker } from './useInheritanceWorker';
import { usePdfExport } from './usePdfExport';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';

export function useInheritanceState() {
  // Plan / Billing state derived from server entitlements
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'notary'>('free');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isEntitlementsLoading, setIsEntitlementsLoading] = useState<boolean>(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkEntitlements() {
      try {
        const res = await fetch('/api/entitlements');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsPaid(Boolean(data.isPaid));
            setUserPlan(data.plan || 'free');
            setOrganizationId(data.organizationId || null);
            setUserId(data.userId || null);
          }
        } else {
          if (isMounted) {
            setIsPaid(false);
            setUserPlan('free');
            setOrganizationId(null);
            setUserId(null);
          }
        }
      } catch {
        if (isMounted) {
          setIsPaid(false);
          setUserPlan('free');
          setOrganizationId(null);
          setUserId(null);
        }
      } finally {
        if (isMounted) {
          setIsEntitlementsLoading(false);
        }
      }
    }
    checkEntitlements();
    return () => { isMounted = false; };
  }, []);

  // Primary Financial & Deceased attributes for Stage 0
  const [deceasedGender, setDeceasedGender] = useState<'male' | 'female'>('male');
  const [estate, setEstate] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);
  const [funeralCosts, setFuneralCosts] = useState<number>(0);
  const [bequest, setBequest] = useState<number>(0);

  // UI Panels / Views state
  const [isEstatePanelOpen, setIsEstatePanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'table' | 'tree' | 'steps'>('summary');
  const [selectedHeirExplanation, setSelectedHeirExplanation] = useState<CalculationResult | null>(null);

  // Export states
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // PDF Export hook
  const { exportToPDFClient, isExportingPDF } = usePdfExport();

  // Sub-hook 1: Munasakhat Stages
  const {
    munasakhatStages,
    setMunasakhatStages,
    currentStageIndex,
    setCurrentStageIndex,
    currentStage,
    addMunasakhatStage,
    removeStage,
    updateStageName,
    updateStageGender,
    updateStageMandatoryBequest,
    updateStageDeceasedChildren,
    updateStageAlreadyInherited,
    updateStageFinancialField,
    updateStageChildrenFromOtherUnion,
    updateStageNoDistantKindredConfirmation,
    updateStageSpouseEligibilityConfirmation,
    updateStagePregnancy,
    updateStagePregnancyDisputed,
    updateStageMinorHeirPresent,
    updateStageDeathOrderUncertain,
    updateStageDiyahExcludedConfirmation,
    acknowledgeStageExclusion,
    removeStageExclusionAcknowledgment,
  } = useMunasakhatStages(showToast);

  // Sub-hook 2: Saved Cases & Persistence
  const {
    savedCases,
    setSavedCases,
    storageError,
    isSavedCasesModalOpen,
    setIsSavedCasesModalOpen,
    isClassicCasesModalOpen,
    setIsClassicCasesModalOpen,
    isImporting,
    setIsImporting,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    isConfirmResetOpen,
    setIsConfirmResetOpen,
    caseToDelete,
    caseToDeleteName,
    saveName,
    setSaveName,
    isSaveModalOpen,
    setIsSaveModalOpen,
    activeCaseId,
    setActiveCaseId,
    officeSettings,
    setOfficeSettings,
    saveOfficeSettings,
    resetOfficeSettings,
    saveCurrentCase,
    updateSavedCase,
    loadCase,
    deleteCase,
    confirmDelete,
    exportData,
    importData,
  } = useSavedCases(
    estate, debts, funeralCosts, bequest, deceasedGender,
    munasakhatStages, setMunasakhatStages,
    setEstate, setDebts, setFuneralCosts, setBequest, setDeceasedGender,
    setCurrentStageIndex, showToast
  );

  // Sub-hook 3: Heir Presence & Modifiers
  const currentGender = useMemo(() => {
    if (currentStageIndex === 0) return deceasedGender;
    const stage = munasakhatStages[currentStageIndex];
    return stage?.deceasedGender ?? inferDeceasedGender(stage?.deceasedHeirId);
  }, [currentStageIndex, munasakhatStages, deceasedGender]);

  // Each Munasakhat stage has its own deceased; never reuse the first deceased's gender.
  const {
    toggleHeir,
    updateCount,
    updateCustomName,
    updateMissingPersonStatus,
    updateImpediment,
    filteredHeirs,
    inputWarnings,
  } = useHeirPresence(munasakhatStages, setMunasakhatStages, currentStageIndex, currentGender, showToast);

  // Derived stage validations
  const stageValidations = useMemo(() => {
    return munasakhatStages.map((st, idx) => {
      const prevRes = idx > 0 ? null : null; // Reserved for multi-stage results if needed
      return validateMunasakhatStageExclusions(st, prevRes, idx);
    });
  }, [munasakhatStages]);

  const currentStageValidation = useMemo(() => {
    return stageValidations[currentStageIndex] || {
      unacknowledgedExclusions: [],
      acknowledgedExclusions: [],
      hasUnacknowledgedExclusions: false,
    };
  }, [stageValidations, currentStageIndex]);

  // Calculations worker integration
  const { isWorkerCalculating } = useInheritanceWorker();

  const allStagesResults = useMemo(() => {
    try {
      return runInheritanceOrchestration([
        munasakhatStages,
        estate,
        debts,
        funeralCosts,
        bequest,
      ]);
    } catch (err) {
      console.error('Orchestration calculation error:', err);
      return [];
    }
  }, [munasakhatStages, estate, debts, funeralCosts, bequest]);

  const results = useMemo(() => {
    if (!allStagesResults || allStagesResults.length === 0) return [];
    return allStagesResults[currentStageIndex]?.results || allStagesResults[0]?.results || [];
  }, [allStagesResults, currentStageIndex]);

  const problemBase = useMemo(() => {
    if (!allStagesResults || allStagesResults.length === 0) return 0;
    return allStagesResults[currentStageIndex]?.results[0]?.problemBase || allStagesResults[0]?.results[0]?.problemBase || 0;
  }, [allStagesResults, currentStageIndex]);

  const currentNetEstate = useMemo(() => {
    if (!allStagesResults || allStagesResults.length === 0) return 0;
    return allStagesResults[currentStageIndex]?.netEstate || allStagesResults[0]?.netEstate || 0;
  }, [allStagesResults, currentStageIndex]);

  const noHeirsRedistribution = useMemo(() => {
    if (!allStagesResults || allStagesResults.length === 0) return undefined;
    return allStagesResults[currentStageIndex]?.noHeirsRedistribution || allStagesResults[0]?.noHeirsRedistribution;
  }, [allStagesResults, currentStageIndex]);

  const netEstate = useMemo(() => {
    return Math.max(0, estate - debts - funeralCosts);
  }, [estate, debts, funeralCosts]);

  const maxBequest = useMemo(() => {
    return netEstate / 3;
  }, [netEstate]);

  const isCalculatorEmpty = useMemo(() => {
    return !currentStage.heirs.some(h => h.isPresent && h.count > 0);
  }, [currentStage]);

  // Reset calculator to default stage 0
  const resetCalculator = useCallback(() => {
    setEstate(0);
    setDebts(0);
    setFuneralCosts(0);
    setBequest(0);
    setDeceasedGender('male');
    setMunasakhatStages(INITIAL_STAGES);
    setCurrentStageIndex(0);
    setActiveCaseId(null);
    setIsConfirmResetOpen(false);
    showToast('تمت إعادة ضبط الحاسبة بنجاح.', 'info');
  }, [showToast, setMunasakhatStages, setCurrentStageIndex, setActiveCaseId, setIsConfirmResetOpen]);

  // Load Classic Cases
  const loadClassicCase = useCallback((classicCase: ClassicCase) => {
    setEstate(0);
    setDebts(0);
    setFuneralCosts(0);
    setBequest(0);

    setMunasakhatStages(() => {
      const stage: typeof INITIAL_STAGES[0] = {
        id: `classic-${classicCase.id}`,
        titleAr: classicCase.nameAr,
        deceasedNameAr: 'المتوفى الأصلي',
        heirs: [],
        hasMandatoryBequest: false,
        deceasedChildren: [],
        unbornOutcome: 'stillborn',
        hasUnbornHeir: false,
        hasChildrenFromOtherUnion: false,
      };

      stage.heirs = filteredHeirs.map(h => {
        const isSelected = classicCase.heirIds.includes(h.id);
        if (!isSelected) {
          return { heirId: h.id, count: 0, isPresent: false };
        }
        const i = classicCase.heirIds.indexOf(h.id);
        return {
          heirId: h.id,
          count: classicCase.counts?.[i] ?? 1,
          isPresent: true,
        };
      });
      return [stage];
    });

    const hasHusband = classicCase.heirIds.includes('husband');
    const hasWife = classicCase.heirIds.includes('wife');
    setDeceasedGender(hasHusband && !hasWife ? 'female' : 'male');
    setCurrentStageIndex(0);
    setIsClassicCasesModalOpen(false);
    showToast(`تم تحميل مسألة: ${classicCase.nameAr}`, 'success');
  }, [filteredHeirs, showToast, setMunasakhatStages, setCurrentStageIndex, setIsClassicCasesModalOpen]);

  // Listen to URL query params to auto-initialize with a classic case
  const hasFiredUrlCaseRef = useRef(false);
  useEffect(() => {
    if (hasFiredUrlCaseRef.current) return;
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const caseId = params.get('case');
      if (caseId) {
        const found = CLASSIC_CASES.find(c => c.id === caseId);
        if (found) {
          hasFiredUrlCaseRef.current = true;
          setTimeout(() => loadClassicCase(found), 300);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (e) {
      console.error('Failed to parse query case parameter:', e);
    }
  }, [loadClassicCase]);

  // Export handlers
  const exportToExcelApplet = useCallback(() => {
    if (isCalculatorEmpty) {
      showToast('لا يمكن التصدير: الرجاء إضافة ورثة أولاً.', 'error');
      return;
    }
    setIsExportingExcel(true);
    import('@/lib/inheritance/excel-export')
      .then(({ exportToExcel }) => {
        exportToExcel(allStagesResults, {
          estate,
          debts,
          funeralCosts,
          bequest,
          deceasedGender,
        }, officeSettings)
          .then(() => showToast('تم تصدير Excel بنجاح ✓', 'success'))
          .catch(err => {
            console.error('Excel Generation Error:', err);
            showToast('حدث خطأ أثناء تصدير Excel.', 'error');
          })
          .finally(() => {
            setIsExportingExcel(false);
          });
      })
      .catch(err => {
        console.error('Excel Loader Error:', err);
        showToast('حدث خطأ أثناء تحميل مكتبة Excel.', 'error');
        setIsExportingExcel(false);
      });
  }, [allStagesResults, estate, debts, funeralCosts, bequest, deceasedGender, showToast, isCalculatorEmpty, officeSettings]);

  const exportToWordApplet = useCallback(() => {
    if (isCalculatorEmpty) {
      showToast('لا يمكن التصدير: الرجاء إضافة ورثة أولاً.', 'error');
      return;
    }
    setIsExportingWord(true);
    import('@/lib/inheritance/word-export')
      .then(({ exportToWord }) => {
        exportToWord(allStagesResults, { estate, debts, funeralCosts, bequest, deceasedGender }, officeSettings)
          .then(() => showToast('تم تصدير Word بنجاح ✓', 'success'))
          .catch(err => {
            console.error('Word Generation Error:', err);
            showToast('حدث خطأ أثناء تصدير Word.', 'error');
          })
          .finally(() => {
            setIsExportingWord(false);
          });
      })
      .catch(err => {
        console.error('Word Loader Error:', err);
        showToast('حدث خطأ أثناء تحميل مكتبة Word.', 'error');
        setIsExportingWord(false);
      });
  }, [allStagesResults, estate, debts, funeralCosts, bequest, deceasedGender, showToast, isCalculatorEmpty, officeSettings]);

  const exportToPDFApplet = useCallback(() => {
    if (isCalculatorEmpty) {
      showToast('لا يمكن التصدير: الرجاء إضافة ورثة أولاً.', 'error');
      return;
    }
    exportToPDFClient(allStagesResults, { estate, debts, funeralCosts, bequest, deceasedGender }, officeSettings, isPaid)
      .then(() => showToast('تم تصدير PDF بنجاح ✓', 'success'))
      .catch((err) => {
        showToast(err.message || 'حدث خطأ أثناء تصدير PDF.', 'error');
      });
  }, [allStagesResults, estate, debts, funeralCosts, bequest, deceasedGender, showToast, isCalculatorEmpty, exportToPDFClient, officeSettings, isPaid]);

  const handleCopyFullSummary = useCallback(async () => {
    if (isCalculatorEmpty) {
      showToast('لا يمكن نسخ الملخص: الرجاء إضافة ورثة أولاً.', 'error');
      return;
    }
    try {
      let summaryText = generateFullLegalSummary(allStagesResults, {
        estate,
        debts,
        funeralCosts,
        bequest,
        deceasedGender,
      });
      if (officeSettings) {
        summaryText += `\n\n═══════════════════════════════════════════\n`;
        summaryText += `تم استخراج هذا الملخص عبر منصة مواريث الرقمية (mawarith.dz) بالتعاون مع:\n`;
        summaryText += `${officeSettings.officialDesignationAr} - ${officeSettings.notaryNameAr}\n`;
        summaryText += `العنوان: ${officeSettings.addressAr} | هاتف: ${officeSettings.phone}\n`;
      }
      await navigator.clipboard.writeText(summaryText);
      showToast('تم نسخ الملخص الكامل بنجاح ✓', 'success');
    } catch (err) {
      console.error('Failed to copy full summary:', err);
      showToast('حدث خطأ أثناء نسخ الملخص الكامل.', 'error');
    }
  }, [allStagesResults, estate, debts, funeralCosts, bequest, deceasedGender, showToast, isCalculatorEmpty, officeSettings]);

  return {
    // state
    isPaid,
    userPlan,
    isEntitlementsLoading,
    organizationId,
    userId,
    deceasedGender, setDeceasedGender,
    estate, setEstate,
    debts, setDebts,
    funeralCosts, setFuneralCosts,
    bequest, setBequest,
    isEstatePanelOpen, setIsEstatePanelOpen,
    viewMode, setViewMode,
    currentStageIndex, setCurrentStageIndex,
    munasakhatStages, setMunasakhatStages,
    savedCases, setSavedCases,
    storageError,
    isSavedCasesModalOpen, setIsSavedCasesModalOpen,
    isClassicCasesModalOpen, setIsClassicCasesModalOpen,
    isImporting, setIsImporting,
    isConfirmDeleteOpen, setIsConfirmDeleteOpen,
    isConfirmResetOpen, setIsConfirmResetOpen,
    isWorkerCalculating,
    caseToDelete, caseToDeleteName,
    selectedHeirExplanation, setSelectedHeirExplanation,
    saveName, setSaveName,
    isSaveModalOpen, setIsSaveModalOpen,
    activeCaseId,
    // derived
    isCalculatorEmpty,
    currentStage,
    currentGender,
    filteredHeirs,
    allStagesResults,
    results,
    currentNetEstate,
    problemBase,
    noHeirsRedistribution,
    stageValidations,
    currentStageValidation,
    netEstate,
    maxBequest,
    inputWarnings,
    // handlers
    toggleHeir,
    updateCount,
    updateCustomName,
    updateMissingPersonStatus,
    updateImpediment,
    addMunasakhatStage,
    removeStage,
    updateStageName,
    updateStageGender,
    updateStageMandatoryBequest,
    updateStageDeceasedChildren,
    updateStageAlreadyInherited,
    updateStageFinancialField,
    updateStageChildrenFromOtherUnion,
    updateStageNoDistantKindredConfirmation,
    updateStageSpouseEligibilityConfirmation,
    updateStagePregnancy,
    updateStagePregnancyDisputed,
    updateStageMinorHeirPresent,
    updateStageDeathOrderUncertain,
    updateStageDiyahExcludedConfirmation,
    acknowledgeStageExclusion,
    removeStageExclusionAcknowledgment,
    resetCalculator,
    saveCurrentCase,
    updateSavedCase,
    loadCase,
    deleteCase,
    confirmDelete,
    exportData,
    importData,
    loadClassicCase,
    exportToExcelApplet,
    exportToWordApplet,
    exportToPDFApplet,
    isExportingPDF,
    isExportingExcel,
    isExportingWord,
    handleCopyFullSummary,
    toast,
    showToast,
    officeSettings,
    setOfficeSettings,
    saveOfficeSettings,
    resetOfficeSettings,
  };
}
