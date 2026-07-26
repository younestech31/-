import { calculateInheritance } from '@/lib/inheritance/inheritance-calculator';
import { resolveNoHeirsPolicy } from '@/lib/inheritance/munasakhat-resolver';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';

export function runInheritanceOrchestration(
  args: [MunasakhatStage[], number, number, number, number]
): StageResult[] {
  const [munasakhatStages, debouncedEstate, debouncedDebts, debouncedFuneralCosts, debouncedBequest] = args;
  const stagesData: StageResult[] = [];

  for (let index = 0; index < munasakhatStages.length; index++) {
    const stage = munasakhatStages[index];
    const stageEstate  = index === 0 ? debouncedEstate       : stage.estate;
    const stageDebts   = index === 0 ? debouncedDebts        : (stage.debts || 0);
    const stageFuneral = index === 0 ? debouncedFuneralCosts : (stage.funeralCosts || 0);
    const stageBequest = index === 0 ? debouncedBequest      : (stage.bequest || 0);

    const sanitizedPresence = Object.values(stage.heirPresence)
      .filter(h => {
        if (index === 0 || !stage.parentHeirId) return true; // م.171 — root stage: no exclusion
        const { excluded } = isHeirExcludedInMunasakhat(h.heirId, stage.parentHeirId);
        return !excluded; // enforce exclusions per MUNASAKHAT_EXCLUSIONS — م.171
      })
      .map(({ customNames: _customNames, ...rest }) => rest);

    const res = calculateInheritance(
      sanitizedPresence,
      stageEstate,
      stageDebts,
      stageFuneral,
      stageBequest,
      stage.hasMandatoryBequest,
      [
        { type: 'son' as const,      count: stage.deceasedSonsCount || 0 },
        { type: 'daughter' as const, count: stage.deceasedDaughtersCount || 0 },
      ].filter(c => c.count > 0),
    );

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

    stagesData.push({ stage, results: res, netEstate: net, noHeirsRedistribution });
  }

  return stagesData;
}
