import { describe, it, expect } from 'vitest';
import { calculateInheritance, HeirPresence } from '../lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '../lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';

describe('Islamic Inheritance Calculation Legal Engine', () => {
  it('Test 1: Al-Minbariyya (Awl from 24 to 27)', () => {
    // Wife + 2 Daughters + Father + Mother
    // Base problem: 24. Shares: Wife 3/24 (1/8), 2 Daughters 16/24 (2/3), Father 4/24 (1/6), Mother 4/24 (1/6). Sum = 27 (Awl = 27).
    const presence: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'daughter', count: 2, isPresent: true },
      { heirId: 'father', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(presence, 270000, 0, 0, 0, false, []);
    const problemBase = results[0].problemBase;
    const isAwl = results[0].calculationType === 'awl';

    expect(problemBase).toBe(27);
    expect(isAwl).toBe(true);

    const wife = results.find(r => r.heirId === 'wife');
    expect(wife?.amount).toBe(30000);
  });

  it('Test 2: Al-Gharawain / Umariyatain (Husband + Mother + Father)', () => {
    // Husband + Mother + Father
    // Husband gets 1/2. Mother gets 1/3 of remainder (which is 1/6 of total). Father gets rest (1/3 of total).
    const presence: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'father', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(presence, 600000, 0, 0, 0, false, []);
    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const father = results.find(r => r.heirId === 'father');

    expect(husband?.amount).toBe(300000);
    expect(mother?.amount).toBe(100000);
    expect(father?.amount).toBe(200000);
  });

  it('Test 3: Radd Case (Daughter + Mother)', () => {
    // Daughter + Mother. Daughter gets 1/2 (3/6), Mother gets 1/6 (1/6). Total = 4/6.
    // Remainder 2/6 is redistributed proportionally to Daughter and Mother (Base becomes 4).
    const presence: HeirPresence[] = [
      { heirId: 'daughter', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(presence, 400000, 0, 0, 0, false, []);
    const daughter = results.find(r => r.heirId === 'daughter');
    const mother = results.find(r => r.heirId === 'mother');

    expect(daughter?.amount).toBe(300000);
    expect(mother?.amount).toBe(100000);
  });

  it('Test 4: Blocking Rules (Son blocks Grandson & Brother)', () => {
    const presence: HeirPresence[] = [
      { heirId: 'son', count: 1, isPresent: true },
      { heirId: 'son_son', count: 1, isPresent: true },
      { heirId: 'full_brother', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(presence, 100000, 0, 0, 0, false, []);
    const son = results.find(r => r.heirId === 'son');
    const grandson = results.find(r => r.heirId === 'son_son');
    const brother = results.find(r => r.heirId === 'full_brother');

    expect(son?.amount).toBe(100000);
    expect(grandson?.isBlocked).toBe(true);
    expect(brother?.isBlocked).toBe(true);
  });

  it('Test 5: Wasiyya Wajiba (Mandatory Bequest)', () => {
    const presence: HeirPresence[] = [
      { heirId: 'son', count: 1, isPresent: true },
      { heirId: 'wife', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(
      presence,
      1200000,
      0,
      0,
      0,
      true, // hasMandatoryBequest enabled
      [{ type: 'son', count: 1 }] // 1 pre-deceased son
    );

    const mandatoryBequest = results.find(r => r.heirId === 'mandatory_bequest');
    expect(mandatoryBequest).toBeDefined();
    expect(mandatoryBequest!.amount).toBeGreaterThan(0);
  });

  it('Test 6: Multi-stage Munasakhat Stage Orchestration Parity', () => {
    const stages: MunasakhatStage[] = [
      {
        id: 'root-1',
        deceasedName: 'المورث الأول',
        estate: 1000000,
        parentHeirId: '',
        parentStageId: '',
        heirPresence: {
          wife: { heirId: 'wife', count: 1, isPresent: true },
          son: { heirId: 'son', count: 2, isPresent: true },
          daughter: { heirId: 'daughter', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
        debts: 50000,
        funeralCosts: 10000,
        bequest: 20000,
      },
      {
        id: 'stage-2',
        deceasedName: 'الابن التابع',
        estate: 200000,
        parentHeirId: 'son',
        parentStageId: 'root-1',
        parentHeirIndex: 0,
        heirPresence: {
          wife: { heirId: 'wife', count: 1, isPresent: true },
          son: { heirId: 'son', count: 1, isPresent: true },
        },
        deceasedSonsCount: 0,
        deceasedDaughtersCount: 0,
        hasMandatoryBequest: false,
        debts: 0,
        funeralCosts: 0,
        bequest: 0,
      },
    ];

    const orchestratorResult = runInheritanceOrchestration([stages, 1000000, 50000, 10000, 20000]);

    expect(orchestratorResult.length).toBe(2);
    expect(orchestratorResult[0].netEstate).toBe(920000);
    expect(orchestratorResult[1].netEstate).toBe(200000);
  });
});
