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

    // Mock globalThis.self to capture the message sent back by worker
    const originalSelf = globalThis.self;
    const messages: unknown[] = [];
    const mockSelf = {
      postMessage: (msg: unknown) => {
        messages.push(msg);
      },
      onmessage: null as unknown
    };
    (globalThis as unknown as Record<string, unknown>).self = mockSelf as unknown as Window & typeof globalThis;

    // Load the worker to run its registration
    await import('../workers/inheritance.worker');

    expect(mockSelf.onmessage).toBeTypeOf('function');

    // Test rejection of malformed payload
    const onMsgFn = mockSelf.onmessage as (e: MessageEvent) => void;
    onMsgFn({ data: { id: 105, args: ["invalid"] } } as MessageEvent);
    expect(messages.length).toBe(1);
    
    const responseMsg = messages[0] as Record<string, unknown>;
    expect(responseMsg.id).toBe(105);
    expect(responseMsg.error).toBe('invalid_worker_input');
    expect(responseMsg.details).toBeDefined();

    // Clean up
    (globalThis as unknown as Record<string, unknown>).self = originalSelf;
  });
});

