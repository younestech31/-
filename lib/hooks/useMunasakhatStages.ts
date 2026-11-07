// lib/hooks/useMunasakhatStages.ts

import { useState, useCallback, useMemo } from 'react';
import { HEIRS } from '@/data/heirs';
import { HeirPresence, DeceasedChildGroup } from '@/lib/inheritance/inheritance-calculator';
import { MunasakhatStage } from '@/lib/inheritance/munasakhat-types';

export function getCurrentStageIndexAfterRemoval(currentIndex: number, removedIndex: number): number {
  // Removing the selected stage selects its predecessor; removing an earlier
  // stage shifts the selection left; removing a later stage keeps it unchanged.
  return removedIndex <= currentIndex ? Math.max(0, currentIndex - 1) : currentIndex;
}

export function inferDeceasedGender(heirId?: string): 'male' | 'female' | null {
  const gender = HEIRS.find(heir => heir.id === heirId)?.gender;
  return gender === 'male' || gender === 'female' ? gender : null;
}

export const DEFAULT_HEIRS_STAGE0: HeirPresence[] = HEIRS.map(h => ({
  heirId: h.id,
  count: 0,
  isPresent: false,
}));

export const INITIAL_STAGES: MunasakhatStage[] = [
  {
    id: 'stage-0',
    titleAr: 'المسألة الأولى (المتوفى الأصلي)',
    deceasedName: 'المتوفى الأصلي',
    deceasedNameAr: 'المتوفى الأصلي',
    heirs: DEFAULT_HEIRS_STAGE0,
    hasMandatoryBequest: false,
    deceasedChildren: [],
    unbornOutcome: 'stillborn',
    hasUnbornHeir: false,
    hasChildrenFromOtherUnion: false,
  },
];

export function createMunasakhatStage(args: {
  stageId: string;
  parentStageId?: string;
  heirName: string;
  amount: number;
  heirId: string;
  parentHeirIndex: number;
}): MunasakhatStage {
  const defaultHeirs: HeirPresence[] = HEIRS.map(h => {
    if (h.id === 'father' || h.id === 'mother' || h.id === 'husband' || h.id === 'wife') {
      return { heirId: h.id, count: 1, isPresent: false };
    }
    return { heirId: h.id, count: 0, isPresent: false };
  });

  return {
    id: args.stageId,
    titleAr: `مناسخة: وفاة ${args.heirName}`,
    deceasedName: args.heirName,
    deceasedNameAr: args.heirName,
    deceasedHeirId: args.heirId,
    parentHeirId: args.heirId,
    parentStageId: args.parentStageId,
    parentHeirIndex: Math.max(0, Math.trunc(args.parentHeirIndex)),
    deceasedGender: inferDeceasedGender(args.heirId) ?? undefined,
    inheritedAmount: Math.max(0, args.amount),
    heirs: defaultHeirs,
    hasMandatoryBequest: false,
    deceasedChildren: [],
    unbornOutcome: 'stillborn',
    hasUnbornHeir: false,
    hasChildrenFromOtherUnion: false,
  };
}

export function useMunasakhatStages(
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [munasakhatStages, setMunasakhatStages] = useState<MunasakhatStage[]>(INITIAL_STAGES);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  const currentStage = useMemo(() => {
    const rawStage = munasakhatStages[currentStageIndex] || munasakhatStages[0] || INITIAL_STAGES[0];
    const heirs = rawStage?.heirs?.length ? rawStage.heirs : (rawStage?.heirPresence ? Object.values(rawStage.heirPresence) : DEFAULT_HEIRS_STAGE0);
    const heirPresence = (rawStage?.heirPresence && Object.keys(rawStage.heirPresence).length > 0)
      ? rawStage.heirPresence
      : heirs.reduce((acc, h) => {
          acc[h.heirId] = h;
          return acc;
        }, {} as Record<string, HeirPresence>);

    return {
      ...rawStage,
      heirs,
      heirPresence,
    };
  }, [munasakhatStages, currentStageIndex]);

  const addMunasakhatStage = useCallback((
    heirName: string,
    amount: number,
    heirId: string,
    parentHeirIndex: number
  ) => {
    const parentStage = munasakhatStages[currentStageIndex];
    const newStage = createMunasakhatStage({
      stageId: `stage-${Date.now()}`,
      parentStageId: parentStage?.id,
      heirName,
      amount,
      heirId,
      parentHeirIndex,
    });

    setMunasakhatStages(prev => [...prev, newStage]);
    setCurrentStageIndex(prev => prev + 1);
    showToast(`تمت إضافة مرحلة مناسخة لـ: ${heirName}`, 'success');
  }, [showToast, munasakhatStages, currentStageIndex]);

  const removeStage = useCallback((index: number) => {
    if (index === 0) {
      showToast('لا يمكن حذف المسألة الأولى الأساسية.', 'error');
      return;
    }
    if (index < 0 || index >= munasakhatStages.length) return;
    setMunasakhatStages(prev => prev.filter((_, i) => i !== index));
    setCurrentStageIndex(prev => getCurrentStageIndexAfterRemoval(prev, index));
    showToast('تم حذف مرحلة المناسخة بنجاح.', 'info');
  }, [showToast, munasakhatStages.length]);

  const updateStageGender = useCallback((gender: 'male' | 'female') => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (!stage || currentStageIndex === 0) return prev;
      next[currentStageIndex] = { ...stage, deceasedGender: gender };
      return next;
    });
  }, [currentStageIndex]);

  const updateStageName = useCallback((name: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      if (next[currentStageIndex]) {
        next[currentStageIndex] = {
          ...next[currentStageIndex],
          deceasedName: name,
          deceasedNameAr: name,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageMandatoryBequest = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      if (next[currentStageIndex]) {
        next[currentStageIndex] = {
          ...next[currentStageIndex],
          hasMandatoryBequest: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageDeceasedChildren = useCallback((
    field: 'type' | 'count' | 'hasOwnChildrenWhoAreAlsoDirectHeirs' | 'priorGiftOrBequestAmount' | 'alreadyInheritedFromParentAmount' | 'deceasedSonsCount' | 'deceasedDaughtersCount',
    value: string | number | boolean
  ) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (!stage) return prev;

      if (field === 'deceasedSonsCount' || field === 'deceasedDaughtersCount') {
        next[currentStageIndex] = {
          ...stage,
          [field]: Math.max(0, Number(value)),
        };
        return next;
      }

      let currentList = stage.deceasedChildren ? [...stage.deceasedChildren] : [];
      if (currentList.length === 0) {
        currentList = [{
          type: 'son',
          count: 1,
          hasOwnChildrenWhoAreAlsoDirectHeirs: false,
          priorGiftOrBequestAmount: 0,
          alreadyInheritedFromParentAmount: 0
        }];
      }

      const updatedFirst = { ...currentList[0] };
      if (field === 'type') updatedFirst.type = value as 'son' | 'daughter';
      else if (field === 'count') updatedFirst.count = Math.max(1, Number(value));
      else if (field === 'hasOwnChildrenWhoAreAlsoDirectHeirs') updatedFirst.hasOwnChildrenWhoAreAlsoDirectHeirs = Boolean(value);
      else if (field === 'priorGiftOrBequestAmount') updatedFirst.priorGiftOrBequestAmount = Math.max(0, Number(value));
      else if (field === 'alreadyInheritedFromParentAmount') updatedFirst.alreadyInheritedFromParentAmount = Math.max(0, Number(value));

      currentList[0] = updatedFirst;

      next[currentStageIndex] = {
        ...stage,
        deceasedChildren: currentList as DeceasedChildGroup[],
      };
      return next;
    });
  }, [currentStageIndex]);

  const updateStageAlreadyInherited = useCallback((value: number) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (!stage) return prev;

      let currentList = stage.deceasedChildren ? [...stage.deceasedChildren] : [];
      if (currentList.length === 0) {
        currentList = [{
          type: 'son',
          count: 1,
          hasOwnChildrenWhoAreAlsoDirectHeirs: false,
          priorGiftOrBequestAmount: 0,
          alreadyInheritedFromParentAmount: value
        }];
      } else {
        currentList[0] = {
          ...currentList[0],
          alreadyInheritedFromParentAmount: value
        };
      }

      next[currentStageIndex] = {
        ...stage,
        deceasedChildren: currentList as DeceasedChildGroup[],
      };
      return next;
    });
  }, [currentStageIndex]);

  const updateStageFinancialField = useCallback((
    field: 'estate' | 'debts' | 'funeralCosts' | 'bequest' | 'ownSeparateAssets',
    value: number
  ) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          [field]: Math.max(0, value),
          ...((field === 'estate' || field === 'ownSeparateAssets')
            ? { confirmedDiyahExcluded: false }
            : {}),
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageChildrenFromOtherUnion = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          hasChildrenFromOtherUnion: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageNoDistantKindredConfirmation = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          confirmedNoDistantKindred: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStagePregnancy = useCallback((
    hasUnbornHeir: boolean,
    unbornOutcome: NonNullable<MunasakhatStage['unbornOutcome']>
  ) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          hasUnbornHeir,
          unbornOutcome,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStagePregnancyDisputed = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          pregnancyDisputed: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageMinorHeirPresent = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          hasMinorHeir: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageDeathOrderUncertain = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          deathOrderUncertain: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const updateStageDiyahExcludedConfirmation = useCallback((checked: boolean) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (stage) {
        next[currentStageIndex] = {
          ...stage,
          confirmedDiyahExcluded: checked,
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const acknowledgeStageExclusion = useCallback((heirId: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (!stage) return prev;
      const current = stage.acknowledgedExclusions || [];
      if (!current.includes(heirId)) {
        next[currentStageIndex] = {
          ...stage,
          acknowledgedExclusions: [...current, heirId],
        };
      }
      return next;
    });
  }, [currentStageIndex]);

  const removeStageExclusionAcknowledgment = useCallback((heirId: string) => {
    setMunasakhatStages(prev => {
      const next = [...prev];
      const stage = next[currentStageIndex];
      if (!stage || !stage.acknowledgedExclusions) return prev;
      next[currentStageIndex] = {
        ...stage,
        acknowledgedExclusions: stage.acknowledgedExclusions.filter(id => id !== heirId),
      };
      return next;
    });
  }, [currentStageIndex]);

  return {
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
    updateStagePregnancy,
    updateStagePregnancyDisputed,
    updateStageMinorHeirPresent,
    updateStageDeathOrderUncertain,
    updateStageDiyahExcludedConfirmation,
    acknowledgeStageExclusion,
    removeStageExclusionAcknowledgment,
  };
}
