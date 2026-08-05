import { calculateInheritance } from '@/lib/inheritance/inheritance-calculator';
import { resolveNoHeirsPolicy } from '@/lib/inheritance/munasakhat-resolver';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';
import { HEIRS } from '@/data/heirs';

export function runInheritanceOrchestration(
  args: [MunasakhatStage[], number, number, number, number]
): StageResult[] {
  const [munasakhatStages, debouncedEstate, debouncedDebts, debouncedFuneralCosts, debouncedBequest] = args;
  const stagesData: StageResult[] = [];

  for (let index = 0; index < munasakhatStages.length; index++) {
    const stage = munasakhatStages[index];
    const inheritedAmount = stage.inheritedFromParentAmount ?? stage.alreadyInheritedFromParentAmount ?? stage.estate ?? 0;
    const ownAssets = stage.ownSeparateAssets ?? 0;
    const stageEstate = index === 0 ? debouncedEstate : (inheritedAmount + ownAssets);
    const stageDebts   = index === 0 ? debouncedDebts        : (stage.debts || 0);
    const stageFuneral = index === 0 ? debouncedFuneralCosts : (stage.funeralCosts || 0);
    const stageBequest = index === 0 ? debouncedBequest      : (stage.bequest || 0);

    // Normalize presence array / record
    const presenceList = stage.heirs || (stage.heirPresence ? Object.values(stage.heirPresence) : []);
    const parentHeirId = stage.parentHeirId || stage.deceasedHeirId;
    const hasOtherUnion = stage.secondDeceasedHasChildrenFromOtherUnion ?? stage.hasChildrenFromOtherUnion ?? false;

    // First pass: identify all present heirs that would be excluded by default
    const excludedHeirWarnings: Array<{ heirId: string; heirNameAr: string; reason: string; source?: string }> = [];
    const heirsToCheck = presenceList.filter(h => h.isPresent && h.count > 0 && !h.isImpeded);

    for (const h of heirsToCheck) {
      if (index === 0 || !parentHeirId) continue;
      
      const { excluded, reason, source } = isHeirExcludedInMunasakhat(
        h.heirId,
        parentHeirId,
        hasOtherUnion
      );
      
      if (excluded) {
        const heirDetails = HEIRS.find(x => x.id === h.heirId);
        excludedHeirWarnings.push({
          heirId: h.heirId,
          heirNameAr: heirDetails?.nameAr || h.heirId,
          reason,
          source,
        });
      }
    }

    // Second pass: filter the presence list, keeping acknowledged exclusions or those bypassed by other unions
    let hasUnverifiedOverride = false;
    const sanitizedPresence = presenceList
      .filter(h => {
        if (index === 0 || !parentHeirId) return true;

        const { excluded } = isHeirExcludedInMunasakhat(
          h.heirId,
          parentHeirId,
          hasOtherUnion
        );

        if (excluded) {
          const isAcknowledged = stage.acknowledgedExclusions?.includes(h.heirId);
          if (isAcknowledged) {
            hasUnverifiedOverride = true;
          }
          return isAcknowledged ?? false;
        }

        return true;
      })
      .map(({ customNames: _customNames, ...rest }) => rest);

    const sonsCount = stage.deceasedSonsCount ?? (stage.deceasedChildren?.filter(c => c.type === 'son').reduce((sum, c) => sum + c.count, 0) || 0);
    const daughtersCount = stage.deceasedDaughtersCount ?? (stage.deceasedChildren?.filter(c => c.type === 'daughter').reduce((sum, c) => sum + c.count, 0) || 0);

    const res = calculateInheritance(
      sanitizedPresence,
      stageEstate,
      stageDebts,
      stageFuneral,
      stageBequest,
      stage.hasMandatoryBequest,
      [
        { 
          type: 'son' as const, 
          count: sonsCount,
          alreadyInheritedFromParentAmount: stage.alreadyInheritedFromParentAmount || 0
        },
        { 
          type: 'daughter' as const, 
          count: daughtersCount,
          alreadyInheritedFromParentAmount: stage.alreadyInheritedFromParentAmount || 0
        },
      ].filter(c => c.count > 0),
    );

    if (hasUnverifiedOverride) {
      res.forEach(r => {
        r.hasUnverifiedOverride = true;
      });
    }

    const mandatoryBequest = res.find(r => r.heirId === 'mandatory_bequest')?.amount ?? 0;
    const actualBequest = res.find(r => r.heirId === 'voluntary_bequest')?.amount ?? 0;
    const net = stageEstate - stageDebts - stageFuneral - actualBequest - mandatoryBequest;

    let noHeirsRedistribution: StageResult['noHeirsRedistribution'] = null;

    if (index > 0 && stage.parentHeirId) {
      const activeHeirs = res.filter(
        r => !r.isBlocked && r.amount > 0 &&
             r.heirId !== 'mandatory_bequest' &&
             r.heirId !== 'voluntary_bequest' &&
             r.heirId !== 'treasury'
      );

      if (activeHeirs.length === 0 && net > 0) {
        const parentStageData = stagesData.find(
          sd => sd.stage.id === stage.parentStageId
        );
        const parentResults = parentStageData?.results ?? [];

        const redistribution = resolveNoHeirsPolicy(stage, net, parentResults);
        noHeirsRedistribution = redistribution;
      }
    }

    stagesData.push({ stage, results: res, netEstate: net, noHeirsRedistribution, excludedHeirWarnings, hasUnverifiedOverride });
  }

  return stagesData;
}
