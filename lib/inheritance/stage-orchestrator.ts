import { calculateInheritance, type DeceasedChildGroup } from '@/lib/inheritance/inheritance-calculator';
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
    const inheritedAmount = stage.inheritedFromParentAmount ?? stage.alreadyInheritedFromParentAmount ?? stage.inheritedAmount ?? stage.estate ?? 0;
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
      
      const { requiresReview, reason, source } = isHeirExcludedInMunasakhat(
        h.heirId,
        parentHeirId,
        hasOtherUnion
      );
      
      if (requiresReview) {
        const heirDetails = HEIRS.find(x => x.id === h.heirId);
        excludedHeirWarnings.push({
          heirId: h.heirId,
          heirNameAr: heirDetails?.nameAr || h.heirId,
          reason,
          source,
        });
      }
    }

    // Review prompts are not legal exclusion decisions. Keep all selected heirs
    // in the calculation, then hold result display until every prompt is reviewed.
    // A user-acknowledged inclusion remains marked as unverified and cannot be exported.
    const hasUnverifiedOverride = heirsToCheck.some(h => {
      if (index === 0 || !parentHeirId) return false;
      const { requiresReview } = isHeirExcludedInMunasakhat(
        h.heirId,
        parentHeirId,
        hasOtherUnion
      );
      return requiresReview && Boolean(stage.acknowledgedExclusions?.includes(h.heirId));
    });
    const sanitizedPresence = presenceList
      .map(({ customNames: _customNames, ...rest }) => rest);

    const sonsCount = stage.deceasedSonsCount ?? (stage.deceasedChildren?.filter(c => c.type === 'son').reduce((sum, c) => sum + c.count, 0) || 0);
    const daughtersCount = stage.deceasedDaughtersCount ?? (stage.deceasedChildren?.filter(c => c.type === 'daughter').reduce((sum, c) => sum + c.count, 0) || 0);

    // Preserve Article 171/172 metadata for each deceased-child group.
    // The UI keeps the legacy count fields separately, so use those counts
    // while carrying the matching group's gift / prior-inheritance metadata.
    const deceasedChildrenForCalculation: DeceasedChildGroup[] = ([
      { type: 'son' as const, count: sonsCount },
      { type: 'daughter' as const, count: daughtersCount },
    ]).filter(group => group.count > 0).map((group): DeceasedChildGroup => {
      const configuredGroup = stage.deceasedChildren?.find(child => child.type === group.type);
      return configuredGroup ? { ...configuredGroup, count: group.count } : group;
    });

    // Older saved cases may store one stage-level offset. Apply it once only;
    // never duplicate the same amount across both the son and daughter groups.
    if (
      stage.alreadyInheritedFromParentAmount &&
      stage.alreadyInheritedFromParentAmount > 0 &&
      deceasedChildrenForCalculation.length > 0 &&
      !deceasedChildrenForCalculation.some(child => child.alreadyInheritedFromParentAmount !== undefined)
    ) {
      deceasedChildrenForCalculation[0] = {
        ...deceasedChildrenForCalculation[0],
        alreadyInheritedFromParentAmount: stage.alreadyInheritedFromParentAmount,
      };
    }

    const res = calculateInheritance(
      sanitizedPresence,
      stageEstate,
      stageDebts,
      stageFuneral,
      stageBequest,
      stage.hasMandatoryBequest,
      deceasedChildrenForCalculation,
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
