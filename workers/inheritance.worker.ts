import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import { WorkerInputSchema, WorkerOutputSchema } from './schema';

export interface WorkerInput {
  id: number;
  args: [MunasakhatStage[], number, number, number, number];
}

export interface WorkerOutput {
  id: number;
  data: StageResult[];
}

export const handleWorkerMessage = (e: MessageEvent) => {
  try {
    const parsed = WorkerInputSchema.safeParse(e.data);

    if (!parsed.success) {
      console.warn('Worker input schema validation failure:', parsed.error);
      self.postMessage({
        id: e.data?.id ?? -1,
        error: 'invalid_worker_input',
        details: parsed.error.flatten()
      });
      return;
    }

    const id = parsed.data.id;
    const args = parsed.data.args as WorkerInput['args'];

    const stagesData = runInheritanceOrchestration(args);

    const response = { id, data: stagesData };
    
    const parsedOutput = WorkerOutputSchema.safeParse(response);
    if (!parsedOutput.success) {
      console.warn('Worker outbound response validation failed:', parsedOutput.error);
    }

    self.postMessage(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Worker thread runtime exception:', err);
    self.postMessage({ id: e.data?.id, error: errorMsg });
  }
};

if (typeof self !== 'undefined') {
  self.onmessage = handleWorkerMessage;
}

