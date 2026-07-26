import { describe, it, expect } from 'vitest';
import { runInheritanceOrchestration } from '../lib/inheritance/stage-orchestrator';
import { WorkerInputSchema } from '../workers/schema';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';

describe('Worker & Main-Thread Synchronous Execution Parity Tests', () => {
  const sampleStages: MunasakhatStage[] = [
    {
      id: 'root-stage',
      deceasedName: 'المورث المتوفى الرئيسي',
      estate: 1200000,
      parentHeirId: '',
      parentStageId: '',
      heirPresence: {
        wife: { heirId: 'wife', count: 1, isPresent: true },
        son: { heirId: 'son', count: 2, isPresent: true },
        daughter: { heirId: 'daughter', count: 2, isPresent: true },
      },
      deceasedSonsCount: 0,
      deceasedDaughtersCount: 0,
      hasMandatoryBequest: false,
      debts: 100000,
      funeralCosts: 20000,
      bequest: 80000,
    },
    {
      id: 'stage-2-son',
      deceasedName: 'الابن المتوفى ثانيا',
      estate: 300000,
      parentHeirId: 'son',
      parentStageId: 'root-stage',
      parentHeirIndex: 0,
      heirPresence: {
        wife: { heirId: 'wife', count: 1, isPresent: true },
        son: { heirId: 'son', count: 1, isPresent: true },
        daughter: { heirId: 'daughter', count: 1, isPresent: true },
      },
      deceasedSonsCount: 0,
      deceasedDaughtersCount: 0,
      hasMandatoryBequest: false,
      debts: 0,
      funeralCosts: 0,
      bequest: 0,
    },
  ];

  const payload = {
    id: 101,
    args: [sampleStages, 1200000, 100000, 20000, 80000] as [MunasakhatStage[], number, number, number, number],
  };

  it('successfully validates worker payload via WorkerInputSchema', () => {
    const parseResult = WorkerInputSchema.safeParse(payload);
    expect(parseResult.success).toBe(true);
  });

  it('produces byte-for-byte identical output when orchestrator is called with validated worker input args', () => {
    const parseResult = WorkerInputSchema.safeParse(payload);
    expect(parseResult.success).toBe(true);

    if (parseResult.success) {
      const args = parseResult.data.args as [MunasakhatStage[], number, number, number, number];
      
      const directOrchestrationResult = runInheritanceOrchestration([
        sampleStages, 1200000, 100000, 20000, 80000
      ]);
      const workerArgsOrchestrationResult = runInheritanceOrchestration(args);

      expect(workerArgsOrchestrationResult).toEqual(directOrchestrationResult);
    }
  });
});
