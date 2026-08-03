'use client';

import { z } from 'zod';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HEIRS } from '@/data/heirs';
import type { HeirPresence, CalculationResult } from '@/lib/inheritance-calculator';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { MunasakhatStage, SavedCase } from '@/components/inheritance/InheritanceCalculator';
import { ClassicCase, CLASSIC_CASES } from '@/data/classic-cases';
import { StageResult } from '@/components/inheritance/ResultsTable';
import { useInheritanceWorker } from '@/lib/hooks/useInheritanceWorker';

type __StageData = {
  stage: MunasakhatStage;
  results: CalculationResult[];
  netEstate: number;
  noHeirsRedistribution?: {
    policy: 'treasury';
    amount: number;
    messageAr: string;
    redistributeTo?: CalculationResult[];
  } | null;
};
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';
import { generateFullLegalSummary } from '@/lib/inheritance/legal-summary';
import { validateAllStages } from '@/lib/inheritance/munasakhat-resolver';
import { usePdfExport } from '@/lib/hooks/usePdfExport';
import { OfficeSettings, DEFAULT_OFFICE_SETTINGS } from '@/lib/inheritance/document-branding';
import { encryptData, decryptData } from '@/lib/crypto';

// ---------- Validation Schema ----------
const SavedCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  deceasedGender: z.enum(['male', 'female']).nullable(),
  estate: z.number(),
  debts: z.number(),
  funeralCosts: z.number(),
  bequest: z.number(),
  stages: z.array(z.object({
    id: z.string(),
    deceasedName: z.string().optional(),
    estate: z.number(),
    parentHeirId: z.string().optional().default(''),
    parentStageId: z.string().optional().default(''),
    parentHeirIndex: z.number().optional().default(-1),
    heirPresence: z.record(z.string(), z.object({
      heirId: z.string(),
      count: z.number(),
      isPresent: z.boolean(),
      hasMandatoryBequest: z.boolean().optional(),
      customNames: z.array(z.string()).optional(),
      isImpeded: z.boolean().optional(),
      impedimentReasonId: z.string().optional(),
      impededIndexes: z.array(z.boolean()).optional(),
      impedimentReasonIds: z.array(z.string().nullable().optional()).optional(),
      missingPersonStatus: z.enum(['none', 'missing_presumed_alive']).optional(),
    })),
    deceasedSonsCount: z.number().optional(),
    deceasedDaughtersCount: z.number().optional(),
    hasMandatoryBequest: z.boolean().optional(),
    debts: z.number().optional().default(0),
    funeralCosts: z.number().optional().default(0),
    bequest: z.number().optional().default(0),
    secondDeceasedHasChildrenFromOtherUnion: z.boolean().optional().default(false),
    acknowledgedExclusions: z.array(z.string()).optional().default([]),
  }))
});

function isSavedCase(obj: unknown): obj is SavedCase {
  return SavedCaseSchema.safeParse(obj).success;
}

// ---------- Initial stage factory ----------
function makeRootStage(): MunasakhatStage {
  return {
    id: 'root',
    deceasedName: 'المتوفى الأول',
    estate: 0,
    parentHeirId: '',
    parentStageId: '',
    parentHeirIndex: -1,
    heirPresence: {},
    deceasedSonsCount: 0,
    deceasedDaughtersCount: 0,
    hasMandatoryBequest: false,
  };
}

// ---------- Hook ----------
export function useInheritanceState() {
  // ── Core financial state ──────────────────────────────────────────────
  const [deceasedGender, setDeceasedGender] = useState<'male' | 'female' | null>(null);
  const [estate, setEstate]               = useState<number>(0);
  const [debts, setDebts]                 = useState<number>(0);
  const [funeralCosts, setFuneralCosts]   = useState<number>(0);
  const [bequest, setBequest]             = useState<number>(0);

  const debouncedEstate = useDebouncedValue(estate, 300);
  const debouncedDebts = useDebouncedValue(debts, 300);
  const debouncedFuneralCosts = useDebouncedValue(funeralCosts, 300);
  const debouncedBequest = useDebouncedValue(bequest, 300);

  // ── UI state ──────────────────────────────────────────────────────────
  const [isEstatePanelOpen, setIsEstatePanelOpen]     = useState(true);
  const [viewMode, setViewMode]                       = useState<'table' | 'tree'>('table');
  const [currentStageIndex, setCurrentStageIndex]     = useState(0);
  const [selectedHeirExplanation, setSelectedHeirExplanation] = useState<CalculationResult | null>(null);

  // ── Munasakhat stages ─────────────────────────────────────────────────
  const [munasakhatStages, setMunasakhatStages] = useState<MunasakhatStage[]>([makeRootStage()]);
  const { calculate, isWorkerCalculating } = useInheritanceWorker();
  const [allStagesResults, setAllStagesResults] = useState<StageResult[]>([]);

  // ── Saved cases state ─────────────────────────────────────────────────
  const [savedCases, setSavedCases]             = useState<SavedCase[]>([]);
  const [storageError, setStorageError]         = useState<string | null>(null);
  const [isSavedCasesModalOpen, setIsSavedCasesModalOpen]   = useState(false);
  const [isClassicCasesModalOpen, setIsClassicCasesModalOpen] = useState(false);
  const [isImporting, setIsImporting]           = useState(false);
  const [saveName, setSaveName]                 = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen]   = useState(false);
  const [activeCaseId, setActiveCaseId]         = useState<string | null>(null);

  // ── Delete confirmation ────────────────────────────────────────────────
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [caseToDelete, setCaseToDelete]               = useState<string | null>(null);

  const { isExportingPDF, exportToPDFClient } = usePdfExport();
  const [isExportingExcel, setIsExportingExcel]       = useState(false);
  const [isExportingWord, setIsExportingWord]         = useState(false);

  const [officeSettings, setOfficeSettings] = useState<OfficeSettings>(DEFAULT_OFFICE_SETTINGS);

  // Load office settings from localStorage on client side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mawarith_office_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setOfficeSettings({
              ...DEFAULT_OFFICE_SETTINGS,
              ...parsed,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load office settings from localStorage:', e);
      }
    }
  }, []);

  // Trigger worker calculation when stages or inputs change
  useEffect(() => {
    let active = true;
    const args: import('../../workers/inheritance.worker').WorkerInput['args'] = [
      munasakhatStages,
      debouncedEstate,
      debouncedDebts,
      debouncedFuneralCosts,
      debouncedBequest
    ];
    
    calculate(args).then((res) => {
      if (active) setAllStagesResults(res);
    });

    return () => { active = false; };
  }, [munasakhatStages, debouncedEstate, debouncedDebts, debouncedFuneralCosts, debouncedBequest, calculate]);
  
  // Note: isCalculating to be used from worker
  // const isCalculating = false;


  // ── Toast notifications ───────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const persistCases = useCallback(async (cases: SavedCase[]) => {
    if (typeof window !== 'undefined') {
      try {
        const plainText = JSON.stringify(cases);
        const cipherText = await encryptData(plainText);
        localStorage.setItem('savedInheritanceCases', cipherText);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          showToast('امتلأت مساحة التخزين الخاصة بالمتصفح. يرجى حذف بعض المسائل القديمة.', 'error');
        }
        throw e;
      }
    }
  }, [showToast]);

  const saveOfficeSettings = useCallback((settings: OfficeSettings) => {
    setOfficeSettings(settings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mawarith_office_settings', JSON.stringify(settings));
        showToast('تم حفظ إعدادات المكتب بنجاح ✓', 'success');
      } catch (e) {
        console.error('Failed to save office settings:', e);
        showToast('فشل في حفظ إعدادات المكتب.', 'error');
      }
    }
  }, [showToast]);

  const resetOfficeSettings = useCallback(() => {
    setOfficeSettings(DEFAULT_OFFICE_SETTINGS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mawarith_office_settings');
        showToast('تمت استعادة الإعدادات الافتراضية بنجاح ✓', 'success');
      } catch (e) {
        console.error('Failed to reset office settings:', e);
      }
    }
  }, [showToast]);

  // ── Load saved cases from localStorage on mount with Decryption ───────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadAndDecryptCases = async () => {
      const saved = localStorage.getItem('savedInheritanceCases');
      if (!saved) return;
      
      try {
        let plainText = saved;
        // Check if plain JSON or encrypted
        if (!saved.trim().startsWith('[')) {
          try {
            plainText = await decryptData(saved);
          } catch (decryptErr) {
            console.warn('Could not decrypt saved cases from localStorage with current or legacy key. Resetting corrupted storage item.', decryptErr);
            localStorage.removeItem('savedInheritanceCases');
            setSavedCases([]);
            return;
          }
        }
        
        let parsed: unknown;
        try {
          parsed = JSON.parse(plainText);
        } catch {
          console.warn('Invalid JSON in savedInheritanceCases. Resetting item.');
          localStorage.removeItem('savedInheritanceCases');
          setSavedCases([]);
          return;
        }

        if (Array.isArray(parsed) && parsed.every(isSavedCase)) {
          setSavedCases(parsed);
          
          // If it was plain text or migrated from legacy key, upgrade/re-encrypt with device key
          if (saved.trim().startsWith('[') || plainText !== saved) {
            await persistCases(parsed);
          }
        } else {
          console.warn('Invalid schema in localStorage savedCases. Resetting item.');
          localStorage.removeItem('savedInheritanceCases');
          setSavedCases([]);
        }
      } catch (e) {
        console.warn('Failed to parse saved cases:', e);
        localStorage.removeItem('savedInheritanceCases');
        setSavedCases([]);
      }
    };
    
    loadAndDecryptCases();
  }, [persistCases]);

  // ── Derived: current stage ─────────────────────────────────────────────
  const currentStage = munasakhatStages[currentStageIndex] ?? munasakhatStages[0];

  // ── Derived: gender for the current stage ─────────────────────────────
  const getStageGender = useCallback(
    (stage: MunasakhatStage): 'male' | 'female' | null => {
      if (stage.id === 'root') return deceasedGender;
      const heir = HEIRS.find(h => h.id === stage.parentHeirId);
      if (heir?.gender === 'female') return 'female';
      if (heir?.gender === 'male') return 'male';
      return 'male'; // default for 'both' gender heirs
    },
    [deceasedGender],
  );

  const currentGender = getStageGender(currentStage);

  // ── Derived: heirs filtered by deceased gender ────────────────────────
  const filteredHeirs = useMemo(
    () =>
      HEIRS.filter(heir => {
        if (!currentGender) return true;
        if (currentGender === 'male' && heir.id === 'husband') return false;
        if (currentGender === 'female' && heir.id === 'wife') return false;
        return true;
      }),
    [currentGender],
  );

  // ── Derived: calculation results for every stage ──────────────────────
  // (Maintained automatically by the worker in `allStagesResults` state)

  const stageData              = allStagesResults[currentStageIndex];
  const results                = stageData?.results ?? [];
  const currentNetEstate       = stageData?.netEstate ?? 0;
  const problemBase            = results.length > 0 ? results[0].problemBase : null;
  const noHeirsRedistribution  = stageData?.noHeirsRedistribution ?? null;

  // ── مراجعة صحة جميع المراحل (كشف الورثة المستبعدين المُفعَّلين) ────
  const stageValidations = useMemo(
    () => validateAllStages(munasakhatStages),
    [munasakhatStages],
  );
  const currentStageValidation = stageValidations[currentStageIndex] ?? null;

  const isCalculatorEmpty = useMemo(() => {
    return !munasakhatStages.some(stage =>
      Object.values(stage.heirPresence).some(h => {
        if (!h.isPresent || h.count <= 0) return false;
        // If all individuals are impeded, this heir contributes nothing
        if (h.isImpeded) return false;
        if (h.impededIndexes && h.impededIndexes.length > 0) {
          const activeCount = h.impededIndexes
            .slice(0, h.count)
            .filter(v => !v).length;
          return activeCount > 0;
        }
        return true;
      })
    );
  }, [munasakhatStages]);

  const netEstate  = estate - debts - funeralCosts;
  const mandatoryBequestAmount = (allStagesResults[0]?.results ?? [])
    .find(r => r.heirId === 'mandatory_bequest')?.amount ?? 0;
  // For BEQUEST CEILING (must match worker's debounced input):
  const debouncedNetEstate = debouncedEstate - debouncedDebts - debouncedFuneralCosts;
  const rawThird = debouncedNetEstate > 0 ? debouncedNetEstate / 3 : 0;
  const maxBequest = Math.max(0, rawThird - mandatoryBequestAmount);

  // ── Input warnings ─────────────────────────────────────────────────────
  const inputWarnings = useMemo<string[]>(() => {
    const warnings: string[] = [];
    if (estate      < 0) warnings.push('قيمة التركة لا يمكن أن تكون سالبة. يرجى إدخال مبلغ صحيح.');
    if (debts       < 0) warnings.push('الديون يجب أن تكون قيمة موجبة.');
    if (funeralCosts< 0) warnings.push('تكاليف التجهيز يجب أن تكون قيمة موجبة.');
    if (bequest     < 0) warnings.push('الوصية يجب أن تكون قيمة موجبة.');

    const hasHeirs = Object.values(currentStage.heirPresence).some(
      h => {
        if (!h.isPresent || h.count <= 0) return false;
        const hasActiveInd = h.impededIndexes && h.impededIndexes.length > 0
          ? h.impededIndexes.some((v, idx) => idx < h.count && !v)
          : !h.isImpeded;
        return hasActiveInd;
      }
    );
    if (!hasHeirs && estate > 0) {
      warnings.push(
        'لم يتم تحديد أي ورثة بعد. يرجى اختيار الورثة من القائمة اليمنى (بند تحديد ورثة) لبدء الحساب.',
      );
    }

    const presence = currentStage.heirPresence;

    if (presence['full_nephew']?.isPresent && !presence['full_brother']?.isPresent)
      warnings.push("تنبيه: لقد اخترت 'ابن أخ شقيق' ولم تختر 'أخ شقيق'. تأكد من عدم وجود الأخ الشقيق للمتوفى، وإلا فإنه يحجب ابنه.");
    if (presence['paternal_nephew']?.isPresent && !presence['paternal_brother']?.isPresent)
      warnings.push("تنبيه: لقد اخترت 'ابن أخ لأب' ولم تختر 'أخ لأب'. تأكد من عدم وجود الأخ لأب للمتوفى، وإلا فإنه يحجب ابنه.");
    if (presence['full_uncle_son']?.isPresent && !presence['full_uncle']?.isPresent)
      warnings.push("تنبيه: لقد اخترت 'ابن عم شقيق' ولم تختر 'عم شقيق'. تأكد من عدم وجود العم الشقيق للمتوفى، وإلا فإنه يحجب ابنه.");
    if (presence['paternal_uncle_son']?.isPresent && !presence['paternal_uncle']?.isPresent)
      warnings.push("تنبيه: لقد اخترت 'ابن عم لأب' ولم تختر 'عم لأب'. تأكد من عدم وجود العم لأب للمتوفى، وإلا فإنه يحجب ابنه.");

    if (presence['father']?.isPresent && presence['grandfather']?.isPresent)
      warnings.push('تنبيه منطقي: وجود الأب يحجب الجد تلقائياً. المادة 159.');
    if (
      presence['mother']?.isPresent &&
      (presence['paternal_grandmother']?.isPresent || presence['maternal_grandmother']?.isPresent)
    )
      warnings.push('تنبيه منطقي: وجود الأم يحجب جميع الجدات. المادة 162.');

    if (estate > 0) {
      if (debts + funeralCosts > estate) {
        warnings.push(
          `التركة غير كافية لتغطية الديون وتكاليف التجهيز (العجز: ${(debts + funeralCosts - estate).toLocaleString('en-US')}). لا يوجد ميراث متبقي.`,
        );
      } else if (netEstate <= 0 && hasHeirs) {
        warnings.push(
          'التركة مستنفدة بالكامل بعد سداد الديون وتكاليف التجهيز والوصايا؛ لا يوجد نصيب متبقي للورثة.',
        );
      } else if (currentNetEstate < 0) {
          warnings.push(
            `عجز مالي: الوصايا تتجاوز التركة المتبقية (العجز: ${Math.abs(currentNetEstate).toLocaleString('en-US')}).`
          );
      } else if (bequest > maxBequest && netEstate > 0) {
        // ✅ إصلاح: أُزيل الشرط المتكرر (netEstate > netEstate/3)
        warnings.push(
          `تنبيه: الوصية تتجاوز الثلث (الحد الأقصى هو ${maxBequest.toLocaleString('en-US')}). سيتم تنفيذ الثلث فقط ما لم يجز الورثة الزيادة.`,
        );
      }
    }

    return warnings;
  }, [estate, debts, funeralCosts, bequest, netEstate, maxBequest, currentStage, currentNetEstate]);

  // ══════════════════════════════════════════════════════════════════════
  //  Heir interaction handlers
  // ══════════════════════════════════════════════════════════════════════

  const toggleHeir = useCallback(
    (heirId: string) => {
      const gender =
        currentStageIndex === 0
          ? deceasedGender
          : (HEIRS.find(h => h.id === currentStage.parentHeirId)?.gender ?? 'male');
      if (gender === 'male' && heirId === 'husband') return;
      if (gender === 'female' && heirId === 'wife') return;
      
      // ✅ منع إضافة الزوج والزوجة معاً
      if (heirId === 'husband' && (currentStage.heirPresence['wife']?.isPresent)) {
        showToast('لا يمكن إضافة الزوج والزوجة معاً', 'error');
        return;
      }
      if (heirId === 'wife' && (currentStage.heirPresence['husband']?.isPresent)) {
        showToast('لا يمكن إضافة الزوج والزوجة معاً', 'error');
        return;
      }
      
      // ── مراجعة المناسخات: منع تفعيل الورثة المستبعدين ──
      if (currentStageIndex > 0 && currentStage.parentHeirId) {
        const { excluded, reason } = isHeirExcludedInMunasakhat(heirId, currentStage.parentHeirId);
        if (excluded) {
          const heirName = HEIRS.find(h => h.id === heirId)?.nameAr ?? heirId;
          showToast(
            `لا يمكن إدراج "${heirName}" في هذه المسألة: ${reason.replace(/^مستبعد: /, '')}`,
            'error'
          );
          return;
        }
      }

      setMunasakhatStages(prev => {
        const next  = [...prev];
        const stage = { ...next[currentStageIndex] };
        const cur   = stage.heirPresence[heirId] ?? { heirId, count: 1, isPresent: false };
        stage.heirPresence = {
          ...stage.heirPresence,
          [heirId]: { ...cur, isPresent: !cur.isPresent },
        };
        next[currentStageIndex] = stage;
        return next;
      });
    },
    [currentStageIndex, deceasedGender, currentStage.parentHeirId, showToast, currentStage.heirPresence],
  );

  const updateCount = useCallback(
    (heirId: string, count: number) => {
      // حدود قانونية: الزوجات أقصاه 4 (م.8 قانون الأسرة)، الزوج واحد فقط
      const maxCount = heirId === 'wife' ? 4 : heirId === 'husband' ? 1 : 99;
      const finalCount = Math.min(maxCount, Math.max(1, count));
      setMunasakhatStages(prev => {
        const next  = [...prev];
        const stage = { ...next[currentStageIndex] };
        const cur   = stage.heirPresence[heirId];
        stage.heirPresence = {
          ...stage.heirPresence,
          [heirId]: {
            ...cur,
            heirId,
            count: finalCount,
            isPresent: cur?.isPresent ?? false,
            customNames: cur?.customNames?.slice(0, finalCount),
            impededIndexes: cur?.impededIndexes?.slice(0, finalCount),
            impedimentReasonIds: cur?.impedimentReasonIds?.slice(0, finalCount),
          },
        };
        next[currentStageIndex] = stage;
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateCustomName = useCallback(
    (heirId: string, index: number, customName: string) => {
      setMunasakhatStages(prev => {
        const next  = [...prev];
        const stage = { ...next[currentStageIndex] };
        if (stage.heirPresence[heirId]) {
          const names    = [...(stage.heirPresence[heirId].customNames ?? [])];
          names[index]   = customName;
          stage.heirPresence = {
            ...stage.heirPresence,
            [heirId]: { ...stage.heirPresence[heirId], customNames: names },
          };
        }
        next[currentStageIndex] = stage;
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateMissingPersonStatus = useCallback(
    (heirId: string, status: 'none' | 'missing_presumed_alive') => {
      setMunasakhatStages(prev => {
        const next  = [...prev];
        const stage = { ...next[currentStageIndex] };
        if (stage.heirPresence[heirId]) {
          stage.heirPresence = {
            ...stage.heirPresence,
            [heirId]: { ...stage.heirPresence[heirId], missingPersonStatus: status },
          };
        }
        next[currentStageIndex] = stage;
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateImpediment = useCallback(
    (heirId: string, index: number, isImpeded: boolean, impedimentReasonId?: string) => {
      setMunasakhatStages(prev => {
        const next  = [...prev];
        const stage = { ...next[currentStageIndex] };
        const cur   = stage.heirPresence[heirId];
        if (!cur) return prev;

        const count = cur.count;

        const impededIndexes = cur.impededIndexes ? [...cur.impededIndexes] : [];
        while (impededIndexes.length < count) {
          impededIndexes.push(cur.isImpeded ?? false);
        }
        impededIndexes[index] = isImpeded;

        const impedimentReasonIds = cur.impedimentReasonIds ? [...cur.impedimentReasonIds] : [];
        while (impedimentReasonIds.length < count) {
          impedimentReasonIds.push(cur.impedimentReasonId);
        }
        impedimentReasonIds[index] = isImpeded ? (impedimentReasonId ?? cur.impedimentReasonId) : undefined;

        // Legacy compatibility: category is fully impeded if ALL are impeded
        const overallImpeded = impededIndexes.length === count && impededIndexes.every(v => v);

        stage.heirPresence = {
          ...stage.heirPresence,
          [heirId]: {
            ...cur,
            isImpeded: overallImpeded,
            impedimentReasonId: overallImpeded ? impedimentReasonIds.find(r => r !== undefined) : undefined,
            impededIndexes,
            impedimentReasonIds,
          },
        };
        next[currentStageIndex] = stage;
        return next;
      });
    },
    [currentStageIndex],
  );

  // ══════════════════════════════════════════════════════════════════════
  //  Munasakhat stage management
  // ══════════════════════════════════════════════════════════════════════

  const addMunasakhatStage = useCallback(
    (heirName: string, amount: number, heirId: string, index: number) => {
      const isAlreadyDeceased = munasakhatStages.some(
        s => s.parentStageId === currentStage.id && s.parentHeirId === heirId && s.parentHeirIndex === index
      );
      if (isAlreadyDeceased) {
        showToast('هذا الوارث قد تم إدراجه كمتوفى سابقاً في سلسلة المناسخات.', 'error');
        return;
      }

      const newStage: MunasakhatStage = {
        id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        deceasedName: heirName,
        estate: amount,
        parentHeirId: heirId,
        parentStageId: currentStage.id,
        parentHeirIndex: index,
        heirPresence: {},
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
        debts: 0,
        funeralCosts: 0,
        bequest: 0,
      };
      setMunasakhatStages(prev => {
        const updated = [...prev, newStage];
        setCurrentStageIndex(updated.length - 1);
        return updated;
      });
    },
    [currentStage.id, munasakhatStages, showToast],
  );

  const removeStage = useCallback((index: number) => {
    if (index === 0) return;
    setMunasakhatStages(prev => {
      const stageToRemove = prev[index];
      if (!stageToRemove) return prev;
      // جمع كل المراحل التابعة للمرحلة المحذوفة بشكل تكراري
      const idsToRemove = new Set<string>([stageToRemove.id]);
      let changed = true;
      while (changed) {
        changed = false;
        prev.forEach(s => {
          if (!idsToRemove.has(s.id) && idsToRemove.has(s.parentStageId)) {
            idsToRemove.add(s.id);
            changed = true;
          }
        });
      }
      const updated = prev.filter(s => !idsToRemove.has(s.id));
      setCurrentStageIndex(prevIdx => Math.min(prevIdx, updated.length - 1));
      return updated;
    });
  }, []);

  const updateStageName = useCallback(
    (name: string) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        next[currentStageIndex] = { ...next[currentStageIndex], deceasedName: name };
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateStageMandatoryBequest = useCallback(
    (checked: boolean) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        next[currentStageIndex] = { ...next[currentStageIndex], hasMandatoryBequest: checked };
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateStageDeceasedChildren = useCallback(
    (field: 'deceasedSonsCount' | 'deceasedDaughtersCount', value: number) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        next[currentStageIndex] = { ...next[currentStageIndex], [field]: value };
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateStageFinancialField = useCallback(
    (field: 'debts' | 'funeralCosts' | 'bequest', value: number) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        next[currentStageIndex] = { ...next[currentStageIndex], [field]: value };
        return next;
      });
    },
    [currentStageIndex],
  );

  const updateStageChildrenFromOtherUnion = useCallback(
    (checked: boolean) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        next[currentStageIndex] = { ...next[currentStageIndex], secondDeceasedHasChildrenFromOtherUnion: checked };
        return next;
      });
    },
    [currentStageIndex],
  );

  const acknowledgeStageExclusion = useCallback(
    (heirId: string) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        const current = next[currentStageIndex];
        const currentAcknowledged = current.acknowledgedExclusions || [];
        if (!currentAcknowledged.includes(heirId)) {
          next[currentStageIndex] = {
            ...current,
            acknowledgedExclusions: [...currentAcknowledged, heirId],
          };
        }
        return next;
      });
    },
    [currentStageIndex],
  );

  const removeStageExclusionAcknowledgment = useCallback(
    (heirId: string) => {
      setMunasakhatStages(prev => {
        const next = [...prev];
        const current = next[currentStageIndex];
        const currentAcknowledged = current.acknowledgedExclusions || [];
        if (currentAcknowledged.includes(heirId)) {
          next[currentStageIndex] = {
            ...current,
            acknowledgedExclusions: currentAcknowledged.filter(id => id !== heirId),
          };
        }
        return next;
      });
    },
    [currentStageIndex],
  );

  // ══════════════════════════════════════════════════════════════════════
  //  Calculator reset
  // ══════════════════════════════════════════════════════════════════════

  const resetCalculator = useCallback(() => {
    setActiveCaseId(null);
    setSaveName('');
    setDeceasedGender(null);
    setEstate(0);
    setDebts(0);
    setFuneralCosts(0);
    setBequest(0);
    setMunasakhatStages([makeRootStage()]);
    setCurrentStageIndex(0);
  }, []);

  // ══════════════════════════════════════════════════════════════════════
  //  Saved cases CRUD
  // ══════════════════════════════════════════════════════════════════════

  const saveCurrentCase = useCallback(async () => {
    if (!saveName.trim()) return;

    if (savedCases.length >= 50) {
      showToast('تم بلوغ الحد الأقصى (50 مسألة). يرجى حذف بعض المسائل القديمة أولاً.', 'error');
      return;
    }

    const newCase: SavedCase = {
      id: Date.now().toString(),
      name: saveName.trim(),
      date: new Date().toISOString(),
      deceasedGender,
      estate,
      debts,
      funeralCosts,
      bequest,
      stages: munasakhatStages,
    };
    const updated = [newCase, ...savedCases];
    try {
      await persistCases(updated);
      setSavedCases(updated);
      setActiveCaseId(newCase.id);
      setIsSaveModalOpen(false);
      setSaveName('');
      setStorageError(null);
      showToast('تم حفظ المسألة بنجاح', 'success');
    } catch {
      setStorageError('تعذر الحفظ (مساحة التخزين ممتلئة).');
    }
  }, [saveName, deceasedGender, estate, debts, funeralCosts, bequest, munasakhatStages, savedCases, showToast, persistCases]);

  const updateSavedCase = useCallback(async () => {
    if (!activeCaseId) return;
    const updated = savedCases.map(c =>
      c.id === activeCaseId
        ? { ...c, date: new Date().toISOString(), deceasedGender, estate, debts, funeralCosts, bequest, stages: munasakhatStages }
        : c,
    );
    try {
      await persistCases(updated);
      setSavedCases(updated);
      setStorageError(null);
      showToast('تم تحديث المسألة بنجاح', 'success');
    } catch {
      setStorageError('تعذر تحديث المسألة: فشل التخزين.');
    }
  }, [activeCaseId, savedCases, deceasedGender, estate, debts, funeralCosts, bequest, munasakhatStages, showToast, persistCases]);

  const loadCase = useCallback((c: SavedCase) => {
    setDeceasedGender(c.deceasedGender);
    setEstate(c.estate);
    setDebts(c.debts);
    setFuneralCosts(c.funeralCosts);
    setBequest(c.bequest);
    setMunasakhatStages(c.stages);
    setActiveCaseId(c.id);
    setSaveName(c.name);
    setCurrentStageIndex(0);
    setIsSavedCasesModalOpen(false);
  }, []);

  // deleteCase: يفتح نافذة التأكيد قبل الحذف
  // e اختياري لأن الاستدعاء يمكن أن يكون من زر بدون حدث (SavedCasesModal)
  const deleteCase = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCaseToDelete(id);
    setIsConfirmDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!caseToDelete) return;
    const updated = savedCases.filter(c => c.id !== caseToDelete);
    setSavedCases(updated);
    await persistCases(updated);
    if (activeCaseId === caseToDelete) setActiveCaseId(null);
    setCaseToDelete(null);
    setIsConfirmDeleteOpen(false);
  }, [caseToDelete, savedCases, activeCaseId, persistCases]);

  // ── caseToDeleteName: اسم الحالة المراد حذفها للعرض في Modal ──────────
  // ✅ إصلاح: نحسب الاسم من savedCases وليس من caseToDelete مباشرة
  const caseToDeleteName = savedCases.find(c => c.id === caseToDelete)?.name ?? '';

  // ══════════════════════════════════════════════════════════════════════
  //  Import / Export
  // ══════════════════════════════════════════════════════════════════════

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(savedCases)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    try {
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `inheritances-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [savedCases]);

  const importData = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_IMPORT_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_IMPORT_SIZE) {
        showToast('حجم الملف كبير جداً (الحد الأقصى 2MB)', 'error');
        e.target.value = '';
        return;
      }

      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const imported: unknown = JSON.parse(event.target?.result as string);
          if (!Array.isArray(imported)) throw new Error('Invalid format');
          // ✅ إصلاح: استخدام isSavedCase بدلاً من (c: any)
          const isValid = imported.every(isSavedCase);
          if (!isValid) throw new Error('بنية البيانات غير صحيحة');

          const merged = [...imported, ...savedCases];
          const seen   = new Set<string>();
          const unique = merged.filter(c => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });

          // ✅ إصلاح: إضافة حراسة SSR و Quota handling
          try {
            persistCases(unique);
            setSavedCases(unique);
            setStorageError(null);
            setTimeout(() => {
              setIsImporting(false);
              showToast('تم استيراد البيانات بنجاح', 'success');
            }, 500);
          } catch {
             setIsImporting(false);
             setStorageError('فشل في استيراد الملف، مساحة التخزين ممتلئة.');
          }
        } catch (err) {
          setIsImporting(false);
          setStorageError('فشل في استيراد الملف. يرجى التأكد من أنه ملف JSON صحيح وبنية بيانات مطابقة.');
          console.error('Import failed', err);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [savedCases, showToast, persistCases],
  );

  // ══════════════════════════════════════════════════════════════════════
  //  Classic cases loader
  // ══════════════════════════════════════════════════════════════════════

  const loadClassicCase = useCallback((classicCase: ClassicCase) => {
    let appliedEstate = 0;

    setEstate(prev => {
      appliedEstate = prev === 0 ? 1_000_000 : prev;
      return appliedEstate;
    });

    setMunasakhatStages(() => {
      const estateToUse = appliedEstate || 1_000_000;
      const stage: MunasakhatStage = {
        id: 'root',
        deceasedName: classicCase.nameAr,
        estate: estateToUse,
        parentHeirId: '',
        parentStageId: '',
        parentHeirIndex: -1,
        heirPresence: {} as Record<string, HeirPresence>,
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
      };
      classicCase.heirIds.forEach((heirId, i) => {
        stage.heirPresence[heirId] = {
          heirId,
          count: classicCase.counts?.[i] ?? 1,
          isPresent: true,
        };
      });
      return [stage];
    });

    const hasHusband = classicCase.heirIds.includes('husband');
    const hasWife    = classicCase.heirIds.includes('wife');
    setDeceasedGender(hasHusband && !hasWife ? 'female' : 'male');
    setCurrentStageIndex(0);
    setIsClassicCasesModalOpen(false);
    showToast(`تم تحميل مسألة: ${classicCase.nameAr}`, 'success');
  }, [setEstate, showToast]);

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

  // ══════════════════════════════════════════════════════════════════════
  //  Excel and Word exports
  // ══════════════════════════════════════════════════════════════════════

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
    exportToPDFClient(allStagesResults, { estate, debts, funeralCosts, bequest, deceasedGender }, officeSettings)
      .then(() => showToast('تم تصدير PDF بنجاح ✓', 'success'))
      .catch((err) => {
        showToast(err.message || 'حدث خطأ أثناء تصدير PDF.', 'error');
      });
  }, [allStagesResults, estate, debts, funeralCosts, bequest, deceasedGender, showToast, isCalculatorEmpty, exportToPDFClient, officeSettings]);

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

  // ══════════════════════════════════════════════════════════════════════
  //  Public API
  // ══════════════════════════════════════════════════════════════════════
  return {
    // state
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
    updateStageMandatoryBequest,
    updateStageDeceasedChildren,
    updateStageFinancialField,
    updateStageChildrenFromOtherUnion,
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
