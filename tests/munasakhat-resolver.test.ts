import { describe, it, expect } from 'vitest';
import { validateAllStages, resolveNoHeirsPolicy } from '../lib/inheritance/munasakhat-resolver';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';

describe('Munasakhat Resolver Tests', () => {
  it('validates stage estate and heir presence correctly', () => {
    const invalidStage: MunasakhatStage = {
      id: 'stage-2',
      deceasedName: '',
      estate: -100,
      parentHeirId: 'son',
      parentStageId: 'root',
      heirPresence: {},
      deceasedSonsCount: 0,
      deceasedDaughtersCount: 0,
      hasMandatoryBequest: false,
      debts: 0,
      funeralCosts: 0,
      bequest: 0,
    };

    const validation = validateAllStages([invalidStage]);
    expect(validation.length).toBe(1);
    expect(validation[0].isValid).toBe(false);
    expect(validation[0].errors).toContain('قيمة التركة لا يمكن أن تكون سالبة');
    expect(validation[0].errors).toContain('اسم المتوفى مطلوب');
    expect(validation[0].errors).toContain('يجب تحديد وارث واحد على الأقل');
  });

  it('validates root stage and valid secondary stage', () => {
    const validStages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المتوفى الرئيسي',
        estate: 500000,
        parentHeirId: '',
        parentStageId: '',
        heirPresence: {
          son: { heirId: 'son', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
        debts: 0,
        funeralCosts: 0,
        bequest: 0,
      },
      {
        id: 'stage-2',
        deceasedName: 'الابن المتوفى',
        estate: 100000,
        parentHeirId: 'son',
        parentStageId: 'root',
        heirPresence: {
          wife: { heirId: 'wife', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
        debts: 0,
        funeralCosts: 0,
        bequest: 0,
      },
    ];

    const validation = validateAllStages(validStages);
    expect(validation[0].isValid).toBe(true);
    expect(validation[1].isValid).toBe(true);
  });

  it('resolves no heirs policy to treasury', () => {
    const stage: MunasakhatStage = {
      id: 'stage-no-heirs',
      deceasedName: 'أحمد المتوفى ثانيا',
      estate: 150000,
      parentHeirId: 'son',
      parentStageId: 'root',
      heirPresence: {},
      deceasedSonsCount: 0,
      deceasedDaughtersCount: 0,
      hasMandatoryBequest: false,
      debts: 0,
      funeralCosts: 0,
      bequest: 0,
    };

    const result = resolveNoHeirsPolicy(stage, 150000, []);
    expect(result.policy).toBe('treasury');
    expect(result.amount).toBe(150000);
    expect(result.messageAr).toContain('تؤول تركة (أحمد المتوفى ثانيا) إلى الخزينة العامة');
  });

  it('proves combined total (inheritedFromParentAmount + ownSeparateAssets) flows into stage calculateInheritance', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المتوفى الأول',
        estate: 100000,
        parentHeirId: '',
        parentStageId: '',
        heirPresence: {
          son: { heirId: 'son', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
      },
      {
        id: 'stage-2',
        deceasedName: 'الابن المتوفى ثانيا',
        estate: 100000,
        inheritedFromParentAmount: 100000,
        ownSeparateAssets: 50000,
        parentHeirId: 'son',
        parentStageId: 'root',
        heirPresence: {
          wife: { heirId: 'wife', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
      },
    ];

    const results = runInheritanceOrchestration([stages, 100000, 0, 0, 0]);
    expect(results.length).toBe(2);
    // Stage 2 net estate must equal inherited (100000) + ownSeparateAssets (50000) = 150000
    expect(results[1].netEstate).toBe(150000);
  });
});
