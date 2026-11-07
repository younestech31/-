// lib/hooks/useHeirPresence.ts

import { useCallback, useMemo } from 'react';
import { HEIRS, MAX_COUNTS } from '@/data/heirs';
import { MunasakhatStage } from '@/lib/inheritance/munasakhat-types';
import { HeirPresence } from '@/lib/inheritance/inheritance-calculator';

export function useHeirPresence(
  munasakhatStages: MunasakhatStage[],
  setMunasakhatStages: React.Dispatch<React.SetStateAction<MunasakhatStage[]>>,
  currentStageIndex: number,
  deceasedGender: 'male' | 'female' | null,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const currentStage = useMemo(() => {
    return munasakhatStages[currentStageIndex] || munasakhatStages[0];
  }, [munasakhatStages, currentStageIndex]);

  const toggleHeir = useCallback((heirId: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const originalStage = next[currentStageIndex];
      if (!originalStage) return prev;

      const stage = { ...originalStage };
      next[currentStageIndex] = stage;
      // Any change to the heir roster invalidates the previous Article 167/180
      // attestation; the user must re-confirm after reviewing the new roster.
      stage.confirmedNoDistantKindred = false;
      stage.confirmedDiyahExcluded = false;
      stage.confirmedSpouseEligibility = false;

      const heirs = stage.heirs || [];
      const heir = heirs.find(h => h.heirId === heirId);
      const isCurrentlyPresent = heir?.isPresent || false;

      if (heirId === 'husband' && deceasedGender === 'male' && !isCurrentlyPresent) {
        showToast('لا يمكن إدخال الزوج عندما يكون المتوفى نذكرًا.', 'error');
        return prev;
      }
      if (heirId === 'wife' && deceasedGender === 'female' && !isCurrentlyPresent) {
        showToast('لا يمكن إدخال الزوجة عندما تكون المتوفاة أنثى.', 'error');
        return prev;
      }

      let nextHeirs = [...heirs];
      if (heirId === 'husband' && !heir?.isPresent) {
        nextHeirs = nextHeirs.map(h => h.heirId === 'wife' ? { ...h, isPresent: false, count: 0 } : h);
      }
      if (heirId === 'wife' && !heir?.isPresent) {
        nextHeirs = nextHeirs.map(h => h.heirId === 'husband' ? { ...h, isPresent: false, count: 0 } : h);
      }

      stage.heirs = nextHeirs.map(h => {
        if (h.heirId === heirId) {
          const nextPresent = !h.isPresent;
          return {
            ...h,
            isPresent: nextPresent,
            count: nextPresent ? (h.count > 0 ? h.count : 1) : 0,
          };
        }
        return h;
      });

      return next;
    });
  }, [currentStageIndex, deceasedGender, setMunasakhatStages, showToast]);

  const updateCount = useCallback((heirId: string, count: number) => {
    const maxCount = MAX_COUNTS[heirId] || 99;
    const clampedCount = Math.max(0, Math.min(count, maxCount));

    setMunasakhatStages(prev => {
      const next = [...prev];
      const originalStage = next[currentStageIndex];
      if (!originalStage) return prev;

      const stage = { ...originalStage };
      next[currentStageIndex] = stage;
      // Any change to the heir roster invalidates the previous Article 167/180
      // attestation; the user must re-confirm after reviewing the new roster.
      stage.confirmedNoDistantKindred = false;
      stage.confirmedDiyahExcluded = false;
      stage.confirmedSpouseEligibility = false;

      stage.heirs = (stage.heirs || []).map(h => {
        if (h.heirId === heirId) {
          return {
            ...h,
            count: clampedCount,
            isPresent: clampedCount > 0,
          };
        }
        return h;
      });

      return next;
    });
  }, [currentStageIndex, setMunasakhatStages]);

  const updateCustomName = useCallback((heirId: string, index: number, customName: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const originalStage = next[currentStageIndex];
      if (!originalStage) return prev;

      const stage = { ...originalStage };
      next[currentStageIndex] = stage;
      // Any change to the heir roster invalidates the previous Article 167/180
      // attestation; the user must re-confirm after reviewing the new roster.
      stage.confirmedNoDistantKindred = false;
      stage.confirmedDiyahExcluded = false;
      stage.confirmedSpouseEligibility = false;

      stage.heirs = (stage.heirs || []).map(h => {
        if (h.heirId === heirId) {
          const currentNames = h.customNames ? [...h.customNames] : [];
          currentNames[index] = customName;
          return {
            ...h,
            customNames: currentNames,
          };
        }
        return h;
      });

      return next;
    });
  }, [currentStageIndex, setMunasakhatStages]);

  const updateMissingPersonStatus = useCallback((heirId: string, status: 'none' | 'missing_presumed_alive') => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const originalStage = next[currentStageIndex];
      if (!originalStage) return prev;

      const stage = { ...originalStage };
      next[currentStageIndex] = stage;
      // Any change to the heir roster invalidates the previous Article 167/180
      // attestation; the user must re-confirm after reviewing the new roster.
      stage.confirmedNoDistantKindred = false;
      stage.confirmedDiyahExcluded = false;
      stage.confirmedSpouseEligibility = false;

      stage.heirs = (stage.heirs || []).map(h => {
        if (h.heirId === heirId) {
          return {
            ...h,
            missingPersonStatus: status,
          };
        }
        return h;
      });

      return next;
    });
  }, [currentStageIndex, setMunasakhatStages]);

  const updateImpediment = useCallback((heirId: string, index: number, isImpeded: boolean, impedimentReasonId?: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const originalStage = next[currentStageIndex];
      if (!originalStage) return prev;

      const stage = { ...originalStage };
      next[currentStageIndex] = stage;
      // Any change to the heir roster invalidates the previous Article 167/180
      // attestation; the user must re-confirm after reviewing the new roster.
      stage.confirmedNoDistantKindred = false;
      stage.confirmedDiyahExcluded = false;
      stage.confirmedSpouseEligibility = false;

      stage.heirs = (stage.heirs || []).map(h => {
        if (h.heirId === heirId) {
          const count = Math.max(1, h.count || 1);
          const currentIndexes = h.impededIndexes ? [...h.impededIndexes] : new Array(count).fill(false);
          const currentReasons = h.impedimentReasonIds ? [...h.impedimentReasonIds] : new Array(count).fill(undefined);

          currentIndexes[index] = isImpeded;
          currentReasons[index] = isImpeded ? impedimentReasonId : undefined;

          const isGroupAllImpeded = count > 0 && currentIndexes.filter((val, i) => i < count && val).length === count;

          return {
            ...h,
            impededIndexes: currentIndexes,
            impedimentReasonIds: currentReasons,
            isImpeded: isGroupAllImpeded,
            impedimentReasonId: isGroupAllImpeded ? impedimentReasonId : undefined,
          };
        }
        return h;
      });

      return next;
    });
  }, [currentStageIndex, setMunasakhatStages]);

  const filteredHeirs = useMemo(() => {
    if (!currentStage) return HEIRS;
    return HEIRS.filter(h => {
      // When a mixed-gender heir group is the deceased, ask for the individual's
      // gender before presenting either spouse as a possible heir.
      if (deceasedGender === null && (h.id === 'husband' || h.id === 'wife')) return false;
      if (h.id === 'husband' && deceasedGender === 'male') return false;
      if (h.id === 'wife' && deceasedGender === 'female') return false;
      return true;
    });
  }, [currentStage, deceasedGender]);

  const inputWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!currentStage) return warnings;

    const heirsMap = new Map<string, HeirPresence>(
      (currentStage.heirs || []).map(h => [h.heirId, h])
    );

    const isPresent = (id: string) => {
      const h = heirsMap.get(id);
      return Boolean(h?.isPresent && h.count > 0);
    };

    if (isPresent('husband') && isPresent('wife')) {
      warnings.push('تنبيه: لا يمكن اجتماع الزوج والزوجة في نفس المسألة للمتوفى نفسه.');
    }
    if (deceasedGender === 'male' && isPresent('husband')) {
      warnings.push('تنبيه: المتوفى ذكر ولا يمكن أن يكون له زوج.');
    }
    if (deceasedGender === 'female' && isPresent('wife')) {
      warnings.push('تنبيه: المتوفاة أنثى ولا يمكن أن يكون لها زوجة.');
    }

    return warnings;
  }, [currentStage, deceasedGender]);

  return {
    toggleHeir,
    updateCount,
    updateCustomName,
    updateMissingPersonStatus,
    updateImpediment,
    filteredHeirs,
    inputWarnings,
  };
}
