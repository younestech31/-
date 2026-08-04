import { useState, useCallback, useEffect, useRef } from 'react';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import type { WorkerInput } from '../../workers/inheritance.worker';
import { CalculationResult, IndividualResult } from '@/lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import Fraction from 'fraction.js';

export function hydrateCalculationResult(r: CalculationResult): CalculationResult {
  return {
    ...r,
    shareFraction: r.shareFraction ? new Fraction(r.shareFraction) : new Fraction(0),
    individuals: r.individuals ? r.individuals.map((ind: IndividualResult) => ({
      ...ind,
      shareFraction: ind.shareFraction ? new Fraction(ind.shareFraction) : new Fraction(0)
    })) : undefined
  };
}

export function hydrateStageResults(stages: StageResult[]): StageResult[] {
  return stages.map(stage => ({
    ...stage,
    results: stage.results ? stage.results.map(hydrateCalculationResult) : [],
    noHeirsRedistribution: stage.noHeirsRedistribution ? {
      ...stage.noHeirsRedistribution,
      redistributeTo: stage.noHeirsRedistribution.redistributeTo 
        ? stage.noHeirsRedistribution.redistributeTo.map(hydrateCalculationResult)
        : undefined
    } : stage.noHeirsRedistribution
  }));
}

function executeCalculationSync(args: WorkerInput['args']): StageResult[] {
  const stagesData = runInheritanceOrchestration(args);
  return hydrateStageResults(stagesData);
}

export function useInheritanceWorker() {
  const [isWorkerCalculating, setIsWorkerCalculating] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef<number>(1);
  const pendingRequestsRef = useRef<Map<number, (res: StageResult[]) => void>>(new Map());

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('../../workers/inheritance.worker.ts', import.meta.url));
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent) => {
          const { id, data, error } = e.data || {};
          const resolve = pendingRequestsRef.current.get(id);
          if (resolve) {
            pendingRequestsRef.current.delete(id);
            setIsWorkerCalculating(pendingRequestsRef.current.size > 0);
            if (error) {
              resolve([]);
            } else {
              resolve(hydrateStageResults(data));
            }
          }
        };

        worker.onerror = (err) => {
          console.error('Worker thread runtime error:', err);
          pendingRequestsRef.current.forEach((resolve) => resolve([]));
          pendingRequestsRef.current.clear();
          setIsWorkerCalculating(false);
        };

        return () => {
          worker.terminate();
          workerRef.current = null;
        };
      } catch (err) {
        console.warn('Failed to initialize Web Worker, falling back to sync calculation:', err);
      }
    }
  }, []);

  const calculate = useCallback((args: WorkerInput['args']): Promise<StageResult[]> => {
    setIsWorkerCalculating(true);
    return new Promise((resolve) => {
      const worker = workerRef.current;
      if (worker) {
        const id = reqIdRef.current++;
        pendingRequestsRef.current.set(id, resolve);
        worker.postMessage({ id, args });
      } else {
        // Fallback to synchronous calculation if Web Worker is not available
        setTimeout(() => {
          try {
            const result = executeCalculationSync(args);
            resolve(result);
          } catch (err) {
            console.error('Calculation execution error:', err);
            resolve([]);
          } finally {
            setIsWorkerCalculating(false);
          }
        }, 0);
      }
    });
  }, []);

  return { calculate, isWorkerCalculating };
}

