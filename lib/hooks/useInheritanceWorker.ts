import { useState, useCallback, useRef, useEffect } from 'react';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import type { WorkerInput } from '../../workers/inheritance.worker';
import { CalculationResult, IndividualResult } from '@/lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import Fraction from 'fraction.js';

function hydrateCalculationResult(r: CalculationResult): CalculationResult {
  return {
    ...r,
    shareFraction: r.shareFraction ? new Fraction(r.shareFraction) : new Fraction(0),
    individuals: r.individuals ? r.individuals.map((ind: IndividualResult) => ({
      ...ind,
      shareFraction: ind.shareFraction ? new Fraction(ind.shareFraction) : new Fraction(0)
    })) : undefined
  };
}

function hydrateStageResults(stages: StageResult[]): StageResult[] {
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
  const messageIdRef = useRef(0);
  const pendingResolvers = useRef<Map<number, { resolve: (data: StageResult[]) => void; args: WorkerInput['args'] }>>(new Map());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const getWorker = () => {
    if (typeof Worker === 'undefined') return null;
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL('../../workers/inheritance.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e: MessageEvent) => {
          const { id, data, error } = e.data;
          const pending = pendingResolvers.current.get(id);
          if (pending) {
            pendingResolvers.current.delete(id);
            if (error || !data) {
              console.warn('Worker error/fallback:', error);
              pending.resolve(executeCalculationSync(pending.args));
            } else {
              pending.resolve(hydrateStageResults(data));
            }
            setIsWorkerCalculating(false);
          }
        };
        workerRef.current.onerror = (e) => {
          console.error('Worker thread error:', e);
          setIsWorkerCalculating(false);
          // Resolve all pending with sync fallback so UI never freezes
          pendingResolvers.current.forEach(({ resolve, args }) => {
            resolve(executeCalculationSync(args));
          });
          pendingResolvers.current.clear();
        };
      } catch (err) {
        console.warn('Failed to instantiate Web Worker, falling back to main-thread execution:', err);
        workerRef.current = null;
        return null;
      }
    }
    return workerRef.current;
  };

  const calculate = useCallback((args: WorkerInput['args']): Promise<StageResult[]> => {
    const worker = getWorker();
    
    if (worker) {
      setIsWorkerCalculating(true);
      const id = messageIdRef.current++;
      return new Promise((resolve) => {
        pendingResolvers.current.set(id, { resolve, args });
        worker.postMessage({ id, args });
      });
    }

    // SSR / Fallback path
    setIsWorkerCalculating(true);
    const result = executeCalculationSync(args);
    setIsWorkerCalculating(false);
    return Promise.resolve(result);
  }, []);

  return { calculate, isWorkerCalculating };
}
