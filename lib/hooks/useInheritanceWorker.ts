import { useState, useCallback } from 'react';
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

  const calculate = useCallback((args: WorkerInput['args']): Promise<StageResult[]> => {
    setIsWorkerCalculating(true);
    return new Promise((resolve) => {
      // Yield briefly to main thread to allow React to update loading state
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
    });
  }, []);

  return { calculate, isWorkerCalculating };
}
