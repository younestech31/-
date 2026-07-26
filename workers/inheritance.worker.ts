import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import { WorkerInputSchema } from './schema';

export interface WorkerInput {
  id: number;
  args: [MunasakhatStage[], number, number, number, number];
}

export interface WorkerOutput {
  id: number;
  data: StageResult[];
}

self.onmessage = (e: MessageEvent) => {
  try {
    const parsed = WorkerInputSchema.safeParse(e.data);
    let id: number;
    let args: WorkerInput['args'] | undefined;

    if (!parsed.success) {
      console.warn('Worker input schema validation fallback:', parsed.error);
      id = e.data?.id;
      args = e.data?.args;
    } else {
      id = parsed.data.id;
      args = parsed.data.args as WorkerInput['args'];
    }

    if (id === undefined || !args) {
      console.error('Invalid worker message format:', e.data);
      return;
    }

    const stagesData = runInheritanceOrchestration(args);

    const response = { id, data: stagesData };
    self.postMessage(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Worker thread runtime exception:', err);
    self.postMessage({ id: e.data?.id, error: errorMsg });
  }
};
