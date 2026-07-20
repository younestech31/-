import { useState, useCallback, useRef, useEffect } from 'react';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import type { WorkerInput } from '../../workers/inheritance.worker';
import { calculateInheritance, CalculationResult, IndividualResult } from '@/lib/inheritance/inheritance-calculator';
import { resolveNoHeirsPolicy } from '@/lib/inheritance/munasakhat-resolver';
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';
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

export function useInheritanceWorker() {
  const [isWorkerCalculating, setIsWorkerCalculating] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const messageIdRef = useRef(0);
  const pendingResolvers = useRef<Map<number, (data: StageResult[]) => void>>(new Map());

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
          const resolve = pendingResolvers.current.get(id);
          if (resolve) {
            pendingResolvers.current.delete(id);
            if (error) {
              console.error('Worker error:', error);
              setIsWorkerCalculating(false);
              return;
            }
            resolve(hydrateStageResults(data));
            setIsWorkerCalculating(false);
          }
        };
        workerRef.current.onerror = (e) => {
          console.error('Worker thread error:', e);
          setIsWorkerCalculating(false);
          // Could reject pending resolvers here based on id
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
        pendingResolvers.current.set(id, resolve);
        worker.postMessage({ id, args });
      });
    }

    // SSR / Fallback path
    setIsWorkerCalculating(true);
    
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
          if (index === 0 || !stage.parentHeirId) return true;
          const { excluded } = isHeirExcludedInMunasakhat(h.heirId, stage.parentHeirId);
          return !excluded;
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

    setIsWorkerCalculating(false);
    return Promise.resolve(hydrateStageResults(stagesData));
  }, []);

  return { calculate, isWorkerCalculating };
}
