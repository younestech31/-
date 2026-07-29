import { describe, it, expect } from 'vitest';
import { 
  calculateInheritance, 
  HeirPresence,
  IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION,
  AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER
} from '../lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '../lib/inheritance/stage-orchestrator';
import { INHERITANCE_BARS } from '../data/inheritance-bars';
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

  it('Test 5b: Tanzeel Articles 171-172 prior gift offset and direct heirs skip', () => {
    const presence: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
    ];

    // Case 1: with prior gift reduction
    const results1 = calculateInheritance(
      presence,
      1200000,
      0,
      0,
      0,
      true,
      [{ type: 'son', count: 1, priorGiftOrBequestAmount: 50000 }]
    );
    const mb1 = results1.find(r => r.heirId === 'mandatory_bequest');
    expect(mb1).toBeDefined();

    // Case 2: skipped because hasOwnChildrenWhoAreAlsoDirectHeirs is true
    const results2 = calculateInheritance(
      presence,
      1200000,
      0,
      0,
      0,
      true,
      [{ type: 'son', count: 1, hasOwnChildrenWhoAreAlsoDirectHeirs: true }]
    );
    const mb2 = results2.find(r => r.heirId === 'mandatory_bequest');
    expect(mb2).toBeUndefined();
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

  it('Test 7: Article 133 Missing Heir withholding and effect on co-heirs', () => {
    // Scenario: Deceased has Mother, Wife, Paternal Brother, and a Missing Full Brother
    // If Full Brother is alive (the missing heir):
    // - Mother gets 1/6 (due to multiple siblings: Full Brother + Paternal Brother)
    // - Wife gets 1/4 (no descendants)
    // - Full Brother blocks Paternal Brother, gets the remaining share (7/12)
    // - Full Brother's share is withheld under Article 133
    const presence: HeirPresence[] = [
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'paternal_brother', count: 1, isPresent: true },
      { heirId: 'full_brother', count: 1, isPresent: true, missingPersonStatus: 'missing_presumed_alive' },
    ];

    const results = calculateInheritance(presence, 1200000, 0, 0, 0, false);

    const motherRes = results.find(r => r.heirId === 'mother');
    const wifeRes = results.find(r => r.heirId === 'wife');
    const fullBrotherRes = results.find(r => r.heirId === 'full_brother');
    const paternalBrotherRes = results.find(r => r.heirId === 'paternal_brother');

    expect(motherRes).toBeDefined();
    expect(motherRes?.share).toBe('1/6'); // 1/6 due to multiple siblings
    expect(wifeRes?.share).toBe('1/4');

    expect(paternalBrotherRes).toBeDefined();
    expect(paternalBrotherRes?.isBlocked).toBe(true); // Blocked by Full Brother

    expect(fullBrotherRes).toBeDefined();
    expect(fullBrotherRes?.isBlocked).toBe(false);
    expect(fullBrotherRes?.isWithheld).toBe(true); // Flagged as withheld!
    expect(fullBrotherRes?.article).toBe(133); // Cites Article 133!
    expect(fullBrotherRes?.reason).toContain('المادة 133');
    
    // Total estate: 1,200,000 دج
    // Mother: 1/6 = 200,000 دج
    // Wife: 1/4 = 300,000 دج
    // Full Brother: 7/12 = 700,000 دج (Withheld)
    // Paternal Brother: 0
    expect(motherRes?.amount).toBe(200000);
    expect(wifeRes?.amount).toBe(300000);
    expect(fullBrotherRes?.amount).toBe(700000);
  });

  /* ========================================================================
   * Item 17: Interpretive Decisions & Named Constants Regression Tests
   * ======================================================================== */
  describe('Item 17: Disputed Interpretive Decisions & Notarial Standards', () => {
    it('17a: IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION constant and effect (Arts. 135/138/148)', () => {
      expect(IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION).toBe(false);

      // Mother + 1 Active Full Brother + 1 Impeded Full Brother (e.g. murderer)
      // Because "الممنوع كالمعدوم", the impeded sibling is excluded from the active count,
      // leaving only 1 active sibling. Mother receives 1/3 (not reduced to 1/6).
      const presence: HeirPresence[] = [
        { heirId: 'mother', count: 1, isPresent: true },
        { 
          heirId: 'full_brother', 
          count: 2, 
          isPresent: true, 
          isImpeded: true, 
          impededIndexes: [false, true], // First brother active, second brother impeded
          impedimentReasonIds: [undefined, 'intentional_killer']
        }
      ];

      const results = calculateInheritance(presence, 600000, 0, 0, 0, false);
      const motherRes = results.find(r => r.heirId === 'mother');
      const brotherRes = results.find(r => r.heirId === 'full_brother');

      expect(motherRes).toBeDefined();
      expect(motherRes?.shareFraction.equals(1/3)).toBe(true);
      expect(motherRes?.amount).toBe(200000); // 1/3 of 600,000

      // Active brother gets remaining 2/3 (400,000 DZD)
      expect(brotherRes?.amount).toBe(400000);
    });

    it('17b: AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER constant and effect (Art. 175)', () => {
      expect(AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER).toBe(true);

      // Husband + Mother + Grandfather + 1 Paternal Sister (0 Full Sisters)
      // Extended Akdariyya: Husband (9/27), Mother (6/27), Grandfather (8/27), Paternal Sister (4/27)
      const presence: HeirPresence[] = [
        { heirId: 'husband', count: 1, isPresent: true },
        { heirId: 'mother', count: 1, isPresent: true },
        { heirId: 'grandfather', count: 1, isPresent: true },
        { heirId: 'paternal_sister', count: 1, isPresent: true },
      ];

      const results = calculateInheritance(presence, 270000, 0, 0, 0, false);
      const husband = results.find(r => r.heirId === 'husband');
      const mother = results.find(r => r.heirId === 'mother');
      const grandfather = results.find(r => r.heirId === 'grandfather');
      const sister = results.find(r => r.heirId === 'paternal_sister');

      expect(husband?.amount).toBe(90000); // 9/27
      expect(mother?.amount).toBe(60000);  // 6/27
      expect(grandfather?.amount).toBe(80000); // 8/27
      expect(sister?.amount).toBe(40000); // 4/27
    });
  });

  /* ========================================================================
   * Item 19: Expanded Automated Test Matrix
   * ======================================================================== */
  describe('Item 19: Expanded Test Matrix', () => {
    it('19.1: Distant Kindred / Dhu al-Arham fallback (Article 168)', () => {
      // Case A: Only Distant Kindred (Maternal Grandfather) present -> Takes entire estate (100%)
      const presenceA: HeirPresence[] = [
        { heirId: 'maternal_grandfather', count: 1, isPresent: true }
      ];
      const resultsA = calculateInheritance(presenceA, 100000, 0, 0, 0, false);
      const mgRes = resultsA.find(r => r.heirId === 'maternal_grandfather');
      expect(mgRes).toBeDefined();
      expect(mgRes?.isBlocked).toBe(false);
      expect(mgRes?.amount).toBe(100000);
      expect(mgRes?.reason).toContain('ذوي الأرحام');

      // Case B: Distant Kindred present with a Quranic heir (Daughter) -> Distant Kindred is blocked
      const presenceB: HeirPresence[] = [
        { heirId: 'daughter', count: 1, isPresent: true },
        { heirId: 'distant_kindred', count: 1, isPresent: true }
      ];
      const resultsB = calculateInheritance(presenceB, 100000, 0, 0, 0, false);
      const dkRes = resultsB.find(r => r.heirId === 'distant_kindred');
      expect(dkRes).toBeDefined();
      expect(dkRes?.isBlocked).toBe(true);
      expect(dkRes?.amount).toBe(0);
    });

    it('19.2: Treasury / No-heir fallback (Article 180)', () => {
      // When no legal heirs exist, treasury takes remaining estate
      const presence: HeirPresence[] = [];
      const results = calculateInheritance(presence, 500000, 0, 0, 0, false);
      const treasury = results.find(r => r.heirId === 'treasury');

      expect(treasury).toBeDefined();
      expect(treasury?.isBlocked).toBe(false);
      expect(treasury?.amount).toBe(500000);
      expect(treasury?.reason).toContain('لعدم وجود مستحق للرد أو عصبة');
    });

    it('19.3: Article 158 Grandfather-with-Siblings Sub-Branches', () => {
      // Sub-branch A: Grandfather + 2 Full Brothers (no other heirs) -> 1/3 of total estate
      const presenceA: HeirPresence[] = [
        { heirId: 'grandfather', count: 1, isPresent: true },
        { heirId: 'full_brother', count: 2, isPresent: true }
      ];
      const resultsA = calculateInheritance(presenceA, 300000, 0, 0, 0, false);
      const gfA = resultsA.find(r => r.heirId === 'grandfather');
      expect(gfA?.amount).toBe(100000); // 1/3 of 300,000

      // Sub-branch B: Grandfather + 1 Full Brother -> Muqasama (1/2 each = 150,000 DZD)
      const presenceB: HeirPresence[] = [
        { heirId: 'grandfather', count: 1, isPresent: true },
        { heirId: 'full_brother', count: 1, isPresent: true }
      ];
      const resultsB = calculateInheritance(presenceB, 300000, 0, 0, 0, false);
      const gfB = resultsB.find(r => r.heirId === 'grandfather');
      expect(gfB?.amount).toBe(150000); // 1/2 of 300,000
      expect(gfB?.reason).toContain('المقاسمة');

      // Sub-branch C: Wife + Grandfather + 2 Full Brothers -> 1/3 of remainder
      // Wife gets 1/4 (100,000 of 400,000). Remainder = 3/4 (300,000).
      // Grandfather gets 1/3 of remainder = 100,000 (25% of total, beating 1/6 flat = 16.67%).
      const presenceC: HeirPresence[] = [
        { heirId: 'wife', count: 1, isPresent: true },
        { heirId: 'grandfather', count: 1, isPresent: true },
        { heirId: 'full_brother', count: 2, isPresent: true }
      ];
      const resultsC = calculateInheritance(presenceC, 400000, 0, 0, 0, false);
      const gfC = resultsC.find(r => r.heirId === 'grandfather');
      expect(gfC?.reason).toContain('ثلث الباقي');

      // Sub-branch D: Wife + 2 Daughters + Grandfather + 2 Full Brothers -> 1/6 flat
      // Wife gets 1/8. 2 Daughters get 2/3. Grandfather gets 1/6 flat.
      const presenceD: HeirPresence[] = [
        { heirId: 'wife', count: 1, isPresent: true },
        { heirId: 'daughter', count: 2, isPresent: true },
        { heirId: 'grandfather', count: 1, isPresent: true },
        { heirId: 'full_brother', count: 2, isPresent: true }
      ];
      const resultsD = calculateInheritance(presenceD, 240000, 0, 0, 0, false);
      const gfD = resultsD.find(r => r.heirId === 'grandfather');
      expect(gfD?.amount).toBe(40000); // 1/6 of 240,000
      expect(gfD?.share).toContain('1/6');

    });

    it('19.4: Inheritance Bars / Impediments (data/inheritance-bars.ts)', () => {
      INHERITANCE_BARS.forEach(bar => {
        // Test each impediment individually on a Son with Mother present
        const presence: HeirPresence[] = [
          { heirId: 'mother', count: 1, isPresent: true },
          { 
            heirId: 'son', 
            count: 1, 
            isPresent: true, 
            isImpeded: true, 
            impedimentReasonId: bar.id,
            impededIndexes: [true],
            impedimentReasonIds: [bar.id]
          }
        ];

        const results = calculateInheritance(presence, 300000, 0, 0, 0, false);
        const motherRes = results.find(r => r.heirId === 'mother');
        const sonRes = results.find(r => r.heirId === 'son');

        if (bar.id === 'involuntary_killer') {
          // Involuntary killer (Art. 137) inherits from property -> Mother gets 1/6 + residue = 100%
          expect(motherRes?.amount).toBe(300000);
        } else {
          // Total impediments (Art. 135/138): Son is completely excluded -> Mother gets 100% via Radd
          expect(sonRes?.amount).toBe(0);
          expect(motherRes?.amount).toBe(300000);
        }
      });
    });

    it('19.5: Multiple Wives Share Splitting (Article 146)', () => {
      // Scenario A: 2 Wives + Son, Estate = 800,000 DZD
      // Total Wife share = 1/8 = 100,000 DZD. Split equally between 2 wives = 50,000 DZD each.
      const presence2Wives: HeirPresence[] = [
        { heirId: 'wife', count: 2, isPresent: true },
        { heirId: 'son', count: 1, isPresent: true }
      ];
      const results2 = calculateInheritance(presence2Wives, 800000, 0, 0, 0, false);
      const wifeRes2 = results2.find(r => r.heirId === 'wife');

      expect(wifeRes2).toBeDefined();
      expect(wifeRes2?.amount).toBe(100000); // Total group share
      expect(wifeRes2?.individuals?.length).toBe(2);
      expect(wifeRes2?.individuals?.[0].amount).toBe(50000);
      expect(wifeRes2?.individuals?.[1].amount).toBe(50000);

      // Scenario B: 4 Wives + Son, Estate = 800,000 DZD
      // Total Wife share = 1/8 = 100,000 DZD. Split equally among 4 wives = 25,000 DZD each.
      const presence4Wives: HeirPresence[] = [
        { heirId: 'wife', count: 4, isPresent: true },
        { heirId: 'son', count: 1, isPresent: true }
      ];
      const results4 = calculateInheritance(presence4Wives, 800000, 0, 0, 0, false);
      const wifeRes4 = results4.find(r => r.heirId === 'wife');

      expect(wifeRes4).toBeDefined();
      expect(wifeRes4?.amount).toBe(100000);
      expect(wifeRes4?.individuals?.length).toBe(4);
      wifeRes4?.individuals?.forEach(ind => {
        expect(ind.amount).toBe(25000);
      });
    });
  });
});
