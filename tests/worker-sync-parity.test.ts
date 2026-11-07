import { describe, it, expect } from 'vitest';
import { runInheritanceOrchestration } from '../lib/inheritance/stage-orchestrator';
import { WorkerInputSchema } from '../workers/schema';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';
import { hydrateStageResults } from '../lib/hooks/useInheritanceWorker';
import { handleWorkerMessage } from '../workers/inheritance.worker';
import Fraction from 'fraction.js';

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
      ownSeparateAssets: 0,
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
      ownSeparateAssets: 0,
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

  it('proves CalculationResult shareFraction values survive postMessage boundary and are correctly restored by hydrateStageResults', async () => {
    const originalSelf = globalThis.self;
    const workerResponse: { value: Record<string, unknown> | null } = { value: null };

    const mockSelf = {
      postMessage: (msg: Record<string, unknown>) => {
        // Simulate postMessage structuredClone serialization across thread boundary
        workerResponse.value = structuredClone(msg);
      },
      onmessage: null as unknown
    };
    (globalThis as unknown as Record<string, unknown>).self = mockSelf as unknown as Window & typeof globalThis;

    handleWorkerMessage({ data: payload } as MessageEvent);

    expect(workerResponse.value).not.toBeNull();
    expect(workerResponse.value?.id).toBe(101);

    const rawWorkerOutput = workerResponse.value?.data as Parameters<typeof hydrateStageResults>[0];
    expect(Array.isArray(rawWorkerOutput)).toBe(true);

    // Verify raw worker output lost prototype methods on postMessage boundary
    const rawResult0 = rawWorkerOutput[0]?.results[0];
    expect(rawResult0?.shareFraction instanceof Fraction).toBe(false);

    // Hydrate stage results
    const hydratedOutput = hydrateStageResults(rawWorkerOutput);
    const hydratedResult0 = hydratedOutput[0]?.results[0];

    // Prove shareFraction is restored to a functional Fraction instance
    expect(hydratedResult0?.shareFraction instanceof Fraction).toBe(true);
    expect(typeof hydratedResult0?.shareFraction.toFraction).toBe('function');

    // Compare with direct orchestration results
    const directResults = runInheritanceOrchestration([
      sampleStages, 1200000, 100000, 20000, 80000
    ]);
    const hydratedDirect = hydrateStageResults(directResults);

    expect(hydratedOutput.length).toEqual(hydratedDirect.length);
    hydratedOutput.forEach((stage, sIdx) => {
      stage.results.forEach((res, rIdx) => {
        const expectedRes = hydratedDirect[sIdx].results[rIdx];
        expect(res.shareFraction.toFraction()).toEqual(expectedRes.shareFraction.toFraction());
        expect(res.amount).toEqual(expectedRes.amount);
      });
    });

    (globalThis as unknown as Record<string, unknown>).self = originalSelf;
  });

  it('rejects malformed payloads and returns structured errors on safeParse failure', async () => {
    const badPayloads = [
      { id: 999 }, // missing args
      { id: 102, args: [sampleStages, -100, 0, 0, 0] }, // negative estate
      { id: 103, args: ["not an array", 100, 0, 0, 0] }, // wrong types
      { id: 104, args: [sampleStages, 100, 0, 0] }, // missing arguments in tuple
    ];

    badPayloads.forEach(badPayload => {
      const parsed = WorkerInputSchema.safeParse(badPayload);
      expect(parsed.success).toBe(false);
    });

    const originalSelf = globalThis.self;
    const messages: unknown[] = [];
    const mockSelf = {
      postMessage: (msg: unknown) => {
        messages.push(msg);
      },
      onmessage: null as unknown
    };
    (globalThis as unknown as Record<string, unknown>).self = mockSelf as unknown as Window & typeof globalThis;

    handleWorkerMessage({ data: { id: 105, args: ["invalid"] } } as MessageEvent);
    expect(messages.length).toBe(1);
    
    const responseMsg = messages[0] as Record<string, unknown>;
    expect(responseMsg.id).toBe(105);
    expect(responseMsg.error).toBe('invalid_worker_input');
    expect(responseMsg.details).toBeDefined();

    (globalThis as unknown as Record<string, unknown>).self = originalSelf;
  });
});


