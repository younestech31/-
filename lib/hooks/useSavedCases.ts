// lib/hooks/useSavedCases.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SavedCase, MunasakhatStage } from '@/lib/inheritance/munasakhat-types';
import { OfficeSettings, DEFAULT_OFFICE_SETTINGS, getPersistedOfficeSettings } from '@/lib/inheritance/document-branding';
import { encryptData, decryptData } from '@/lib/crypto';

const STORAGE_KEY = 'mawarith_saved_cases_v2';
const OFFICE_SETTINGS_KEY = 'mawarith_office_settings_v1';

export function useSavedCases(
  estate: number,
  debts: number,
  funeralCosts: number,
  bequest: number,
  deceasedGender: 'male' | 'female',
  munasakhatStages: MunasakhatStage[],
  setMunasakhatStages: React.Dispatch<React.SetStateAction<MunasakhatStage[]>>,
  setEstate: React.Dispatch<React.SetStateAction<number>>,
  setDebts: React.Dispatch<React.SetStateAction<number>>,
  setFuneralCosts: React.Dispatch<React.SetStateAction<number>>,
  setBequest: React.Dispatch<React.SetStateAction<number>>,
  setDeceasedGender: React.Dispatch<React.SetStateAction<'male' | 'female'>>,
  setCurrentStageIndex: React.Dispatch<React.SetStateAction<number>>,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Modals state
  const [isSavedCasesModalOpen, setIsSavedCasesModalOpen] = useState(false);
  const [isClassicCasesModalOpen, setIsClassicCasesModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);

  // Save case state
  const [saveName, setSaveName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // Office Settings state
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings>(DEFAULT_OFFICE_SETTINGS);

  // Load saved cases and office settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.crypto || !window.crypto.subtle) {
      setStorageError('تنبيه أمان: تقنية التشفير الآمن (WebCrypto API) غير متوفرة في هذا المتصفح أو سياق التشغيل غير الآمن.');
      return;
    }

    async function loadCases() {
      try {
        const rawCases = localStorage.getItem(STORAGE_KEY);
        if (rawCases) {
          try {
            const decryptedStr = await decryptData(rawCases);
            const parsed = JSON.parse(decryptedStr);
            if (Array.isArray(parsed)) {
              setSavedCases(parsed);
              setStorageError(null);
            }
          } catch (decryptErr) {
            // Check if legacy Base64 format exists for automatic migration
            try {
              const legacyParsed = JSON.parse(decodeURIComponent(atob(rawCases)));
              if (Array.isArray(legacyParsed)) {
                setSavedCases(legacyParsed);
                const encrypted = await encryptData(JSON.stringify(legacyParsed));
                localStorage.setItem(STORAGE_KEY, encrypted);
                setStorageError(null);
              } else {
                throw decryptErr;
              }
            } catch {
              console.error('Failed to decrypt saved cases:', decryptErr);
              setStorageError('تعذر فك تشفير القضايا المحفوظة من الذاكرة المحلية (خطأ في مفتاح التشفير أو تلف البيانات).');
            }
          }
        }
      } catch (e) {
        console.error('Failed to load saved cases from localStorage:', e);
        setStorageError('تعذر تحميل القضايا المحفوظة من الذاكرة المحلية.');
      }
    }

    loadCases();

    try {
      const rawSettings = localStorage.getItem(OFFICE_SETTINGS_KEY);
      if (rawSettings) {
        const parsedSettings = JSON.parse(rawSettings);
        if (parsedSettings && typeof parsedSettings === 'object' && !Array.isArray(parsedSettings)) {
          const hadStoredPassphrase = Object.prototype.hasOwnProperty.call(parsedSettings, 'cloudSyncPassphrase');
          const safeSettings = getPersistedOfficeSettings(parsedSettings as OfficeSettings);
          setOfficeSettings({ ...DEFAULT_OFFICE_SETTINGS, ...safeSettings });

          // Migrate older settings that stored the cloud passphrase in plaintext.
          if (hadStoredPassphrase) {
            try {
              localStorage.setItem(OFFICE_SETTINGS_KEY, JSON.stringify(safeSettings));
            } catch (migrationError) {
              console.error('Failed to remove the legacy plaintext cloud passphrase:', migrationError);
              setStorageError('تعذر حذف عبارة مرور المزامنة القديمة من التخزين المحلي. افتح إعدادات المتصفح وامسح بيانات الموقع بعد حفظ نسخة آمنة من القضايا.');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load office settings from localStorage:', e);
    }
  }, []);

  const persistCases = useCallback(async (cases: SavedCase[]) => {
    setSavedCases(cases);
    if (typeof window === 'undefined') return;

    if (!window.crypto || !window.crypto.subtle) {
      setStorageError('تنبيه أمان: تقنية التشفير الآمن غير متوفرة في هذا المتصفح. يتعذر حفظ القضايا.');
      return;
    }

    try {
      const encrypted = await encryptData(JSON.stringify(cases));
      localStorage.setItem(STORAGE_KEY, encrypted);
      setStorageError(null);
    } catch (e) {
      console.error('Failed to save cases to localStorage:', e);
      setStorageError('حدث خطأ أثناء تشفير وحفظ القضايا في الذاكرة المحلية.');
    }
  }, []);

  const saveOfficeSettings = useCallback((settings: OfficeSettings) => {
    setOfficeSettings(settings);
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OFFICE_SETTINGS_KEY, JSON.stringify(getPersistedOfficeSettings(settings)));
      showToast('تم حفظ إعدادات المكتب والترويسة بنجاح ✓', 'success');
    } catch (e) {
      console.error('Failed to save office settings:', e);
      showToast('حدث خطأ أثناء حفظ إعدادات المكتب.', 'error');
    }
  }, [showToast]);

  const resetOfficeSettings = useCallback(() => {
    setOfficeSettings(DEFAULT_OFFICE_SETTINGS);
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(OFFICE_SETTINGS_KEY);
      showToast('تمت إعادة ضبط إعدادات المكتب إلى الافتراضية.', 'info');
    } catch (e) {
      console.error('Failed to reset office settings:', e);
    }
  }, [showToast]);

  const saveCurrentCase = useCallback(() => {
    if (!saveName.trim()) {
      showToast('الرجاء إدخال اسم للقضية.', 'error');
      return;
    }

    const newCase: SavedCase = {
      id: `case-${Date.now()}`,
      name: saveName.trim(),
      date: new Date().toLocaleDateString('ar-EG'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estate,
      debts,
      funeralCosts,
      bequest,
      deceasedGender,
      munasakhatStages,
      stages: munasakhatStages,
    };

    const updated = [newCase, ...savedCases];
    persistCases(updated);
    setActiveCaseId(newCase.id);
    setIsSaveModalOpen(false);
    setSaveName('');
    showToast(`تم حفظ القضية: "${newCase.name}" بنجاح ✓`, 'success');
  }, [saveName, estate, debts, funeralCosts, bequest, deceasedGender, munasakhatStages, savedCases, persistCases, showToast]);

  const updateSavedCase = useCallback(() => {
    if (!activeCaseId) return;

    const existingIndex = savedCases.findIndex(c => c.id === activeCaseId);
    if (existingIndex === -1) {
      showToast('القضية النشطة غير موجودة في القائمة المحفوظة.', 'error');
      return;
    }

    const updatedCases = [...savedCases];
    const existingCase = updatedCases[existingIndex];

    updatedCases[existingIndex] = {
      ...existingCase,
      updatedAt: new Date().toISOString(),
      estate,
      debts,
      funeralCosts,
      bequest,
      deceasedGender,
      munasakhatStages,
      stages: munasakhatStages,
    };

    persistCases(updatedCases);
    showToast(`تم تحديث القضية: "${existingCase.name}" بنجاح ✓`, 'success');
  }, [activeCaseId, savedCases, estate, debts, funeralCosts, bequest, deceasedGender, munasakhatStages, persistCases, showToast]);

  const loadCase = useCallback((c: SavedCase) => {
    setEstate(c.estate);
    setDebts(c.debts);
    setFuneralCosts(c.funeralCosts);
    setBequest(c.bequest);
    setDeceasedGender(c.deceasedGender || 'male');
    setMunasakhatStages(c.munasakhatStages || c.stages || []);
    setCurrentStageIndex(0);
    setActiveCaseId(c.id);
    setIsSavedCasesModalOpen(false);
    showToast(`تم تحميل القضية: "${c.name}"`, 'success');
  }, [setEstate, setDebts, setFuneralCosts, setBequest, setDeceasedGender, setMunasakhatStages, setCurrentStageIndex, showToast]);

  const deleteCase = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCaseToDelete(id);
    setIsConfirmDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!caseToDelete) return;

    const updated = savedCases.filter(c => c.id !== caseToDelete);
    persistCases(updated);

    if (activeCaseId === caseToDelete) {
      setActiveCaseId(null);
    }

    setIsConfirmDeleteOpen(false);
    setCaseToDelete(null);
    showToast('تم حذف القضية بنجاح.', 'info');
  }, [caseToDelete, savedCases, activeCaseId, persistCases, showToast]);

  const caseToDeleteName = useMemo(() => {
    if (!caseToDelete) return '';
    const found = savedCases.find(c => c.id === caseToDelete);
    return found ? found.name : '';
  }, [caseToDelete, savedCases]);

  const exportData = useCallback(() => {
    try {
      const exportObject = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        cases: savedCases,
      };
      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `mawarith_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('تم تصدير النسخة الاحتياطية بنجاح ✓', 'success');
    } catch (e) {
      console.error('Failed to export data:', e);
      showToast('حدث خطأ أثناء تصدير البيانات.', 'error');
    }
  }, [savedCases, showToast]);

  const importData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let newCases: SavedCase[] = [];
        if (parsed && Array.isArray(parsed.cases)) {
          newCases = parsed.cases;
        } else if (Array.isArray(parsed)) {
          newCases = parsed;
        } else {
          throw new Error('تنسيق الملف غير صالح.');
        }

        if (newCases.length === 0) {
          showToast('الملف المستورد لا يحتوي على قضايا.', 'error');
          setIsImporting(false);
          return;
        }

        // Merge imported cases with existing ones, avoiding exact ID duplicates
        const existingIds = new Set(savedCases.map(c => c.id));
        const filteredNewCases = newCases.map(c => {
          if (existingIds.has(c.id)) {
            return { ...c, id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
          }
          return c;
        });

        const merged = [...filteredNewCases, ...savedCases];
        persistCases(merged);
        showToast(`تم استيراد ${filteredNewCases.length} قضية بنجاح ✓`, 'success');
      } catch (err) {
        console.error('Failed to import cases:', err);
        showToast('فشل استيراد الملف: الرجاء التأكد من صحة التنسيق.', 'error');
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };

    reader.onerror = () => {
      showToast('حدث خطأ أثناء قراءة الملف.', 'error');
      setIsImporting(false);
      if (e.target) e.target.value = '';
    };

    reader.readAsText(file);
  }, [savedCases, persistCases, showToast]);

  return {
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
    setCaseToDelete,
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
  };
}
