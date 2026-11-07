import { describe, it, expect, vi } from 'vitest';
import { validateAllStages, resolveNoHeirsPolicy } from '../lib/inheritance/munasakhat-resolver';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';
import { createMunasakhatStage, getCurrentStageIndexAfterRemoval, inferDeceasedGender } from '../lib/hooks/useMunasakhatStages';

describe('Munasakhat Resolver Tests', () => {
  it('links each new stage to the correct parent stage and deceased heir index', () => {
    const stage = createMunasakhatStage({
      stageId: 'stage-secondary',
      parentStageId: 'stage-root',
      heirName: 'الابن المتوفى',
      amount: 85000,
      heirId: 'son',
      parentHeirIndex: 2,
    });

    expect(stage.parentStageId).toBe('stage-root');
    expect(stage.parentHeirId).toBe('son');
    expect(stage.deceasedHeirId).toBe('son');
    expect(stage.parentHeirIndex).toBe(2);
    expect(stage.inheritedAmount).toBe(85000);
    expect(stage.deceasedGender).toBe('male');
  });

  it('keeps the selected stage correct when deleting any stage from the stage list', () => {
    expect(getCurrentStageIndexAfterRemoval(2, 3)).toBe(2); // delete a later stage
    expect(getCurrentStageIndexAfterRemoval(2, 1)).toBe(1); // delete an earlier stage
    expect(getCurrentStageIndexAfterRemoval(2, 2)).toBe(1); // delete the selected stage
    expect(getCurrentStageIndexAfterRemoval(0, 1)).toBe(0); // root remains selected
  });

  it('infers gender for single-gender heirs and requires input for mixed groups', () => {
    expect(inferDeceasedGender('son')).toBe('male');
    expect(inferDeceasedGender('daughter')).toBe('female');
    expect(inferDeceasedGender('maternal_siblings')).toBeNull();
    expect(inferDeceasedGender('unknown-heir')).toBeNull();
  });

  it('validates the actual stage-0 shape using Arabic name and heirs array', () => {
    const [validation] = validateAllStages([{
      id: 'stage-0',
      deceasedNameAr: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      heirs: [{ heirId: 'son', count: 1, isPresent: true }],
    }]);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
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
      confirmedNoDistantKindred: true,
    };

    const priorAgnate = [{ heirId: 'full_brother', amount: 50000 }] as unknown as Parameters<typeof resolveNoHeirsPolicy>[2];
    const result = resolveNoHeirsPolicy(stage, 150000, priorAgnate);
    expect(result.policy).toBe('treasury');
    expect(result.amount).toBe(150000);
    expect(result.messageAr).toContain('تؤول تركة (أحمد المتوفى ثانيا) إلى الخزينة العامة');
    expect(result.redistributeTo).toBeUndefined();
  });

  it('refuses treasury routing when Article 167/180 distant-kindred confirmation is missing', () => {
    const stage: MunasakhatStage = {
      id: 'stage-unconfirmed',
      deceasedName: 'متوفى ثانيا',
      parentHeirId: 'son',
      hasMandatoryBequest: false,
    };

    expect(() => resolveNoHeirsPolicy(stage, 150000, [])).toThrow(/Article 167\/180 confirmation/);
  });

  it('holds an empty estate case for Article 180 review instead of assigning it to treasury', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([], 150000, 0, 0, 0);
    expect(results.some(result => result.heirId === 'article_180_review')).toBe(true);
    expect(results.some(result => result.heirId === 'treasury')).toBe(false);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(0);
  });

  it('routes an empty estate case to treasury only after explicit no-distant-kindred confirmation', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([], 150000, 0, 0, 0, false, [], 'stillborn', false, true);
    expect(results.find(result => result.heirId === 'treasury')?.amount).toBe(150000);
    expect(results.some(result => result.heirId === 'article_180_review')).toBe(false);
  });

  it('uses legacy heirPresence data when a saved stage contains an empty heirs array', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      heirs: [],
      heirPresence: {
        son: { heirId: 'son', count: 1, isPresent: true },
      },
    }];

    const [result] = runInheritanceOrchestration([stages, 100000, 0, 0, 0]);
    expect(result.noHeirsNeedsManualReview).toBe(false);
    expect(amountFor(result.results, 'son')).toBe(100000);
    expect(result.results.some(row => row.heirId === 'treasury')).toBe(false);
  });

  it('does not return a spouse-only residue to the spouse before Article 167 distant-kindred review', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([present('husband')], 240000, 0, 0, 0);
    expect(amountFor(results, 'husband')).toBe(120000);
    expect(results.some(result => result.heirId === 'article_180_review')).toBe(true);
    expect(results.some(result => result.heirId === 'treasury')).toBe(false);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('returns spouse-only residue only after confirmation that no entitled distant kindred exists', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([present('husband')], 240000, 0, 0, 0, false, [], 'stillborn', false, true);
    expect(amountFor(results, 'husband')).toBe(240000);
    expect(results.some(result => result.heirId === 'article_180_review')).toBe(false);
  });

  it('marks a secondary no-heirs stage as unresolved until the Article 180 confirmation is provided', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المتوفى الأول',
        hasMandatoryBequest: false,
        heirs: [present('son')],
      },
      {
        id: 'stage-empty',
        deceasedName: 'المتوفى الثاني',
        parentHeirId: 'son',
        parentStageId: 'root',
        hasMandatoryBequest: false,
        inheritedAmount: 150000,
        heirs: [],
      },
    ];
    const [root, second] = runInheritanceOrchestration([stages, 150000, 0, 0, 0]);
    expect(root.noHeirsNeedsManualReview).toBe(false);
    expect(second.noHeirsNeedsManualReview).toBe(true);
    expect(second.results.some(result => result.heirId === 'treasury')).toBe(false);
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
        inheritedAmount: 100000,
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

  it('withholds shares when more than one grandmother is entered without degree details under Articles 149 and 161', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      heirs: [
        present('husband'),
        present('maternal_grandmother', 2),
      ],
    }];

    const [result] = runInheritanceOrchestration([stages, 120000, 0, 0, 0]);
    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('withholds all share results when Article 155 granddaughter cousin degree needs review', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      heirs: [
        present('granddaughter'),
        present('full_uncle_son'),
      ],
    }];

    const [result] = runInheritanceOrchestration([stages, 120000, 0, 0, 0]);
    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('withholds automated Article 169–172 tanzil when only aggregate deceased-child counts are available', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المتوفى الأصلي',
        deceasedSonsCount: 1,
        deceasedDaughtersCount: 0,
        deceasedChildren: [{ type: 'son', count: 1, priorGiftOrBequestAmount: 700000 }],
        heirs: [{ heirId: 'wife', count: 1, isPresent: true }],
        hasMandatoryBequest: true,
      },
    ];
    const [result] = runInheritanceOrchestration([stages, 1200000, 0, 0, 0]);
    expect(result.tanzilNeedsManualReview).toBe(true);
    expect(result.results).toEqual([]);
    expect(result.results.some(row => row.heirId === 'mandatory_bequest')).toBe(false);
  });

  it('marks grandfather with both full and paternal sibling lines as requiring manual review', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [
      {
        id: 'root',
        deceasedName: 'المتوفى الأصلي',
        hasMandatoryBequest: false,
        heirs: [
          present('grandfather'),
          present('full_sister'),
          present('paternal_brother'),
        ],
      },
    ];
    const [result] = runInheritanceOrchestration([stages, 90000, 0, 0, 0]);
    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('keeps an involuntary killer in the per-person group-share denominator', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([{
      heirId: 'full_brother',
      count: 2,
      isPresent: true,
      isImpeded: true,
      impededIndexes: [false, true],
      impedimentReasonIds: [undefined, 'involuntary_killer'],
    }], 600000, 0, 0, 0, false);
    const brothers = results.find(row => row.heirId === 'full_brother');
    expect(brothers?.individuals?.map(person => person.amount)).toEqual([300000, 300000]);
    expect(brothers?.individuals?.reduce((sum, person) => sum + person.amount, 0)).toBe(brothers?.amount);
  });

  it('restricts CSP frame ancestors to the same origin', async () => {
    const { buildCspHeader } = await import('../lib/security/csp');
    expect(buildCspHeader()).toContain("frame-ancestors 'self'");
    expect(buildCspHeader()).not.toContain('frame-ancestors *');
    expect(buildCspHeader('test-nonce')).toContain("'nonce-test-nonce'");
  });

  it('rejects cross-organization cloud-case ID conflicts instead of reporting success', async () => {
    vi.resetModules();
    const session = {
      userId: 'user-a',
      email: 'user@example.test',
      name: 'Test User',
      organizationId: 'org-a',
      plan: 'paid' as const,
      role: 'notary' as const,
    };
    const verifyPaidSubscription = vi.fn().mockResolvedValue({ isPaid: true, session });
    const returning = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'same-case-id' }]);
    let conflictConfig: Record<string, unknown> | undefined;
    const getDb = vi.fn().mockReturnValue({
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: (config: Record<string, unknown>) => {
            conflictConfig = config;
            return { returning };
          },
        }),
      }),
    });

    vi.doMock('@/lib/auth/session', () => ({ verifyPaidSubscription }));
    vi.doMock('@/lib/db/client', () => ({ getDb }));

    try {
      const [{ POST }, { NextRequest }] = await Promise.all([
        import('@/app/api/cases/route'),
        import('next/server'),
      ]);
      const makeRequest = () => new NextRequest('http://localhost/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 'same-case-id',
          caseNameEncrypted: 'encrypted-name',
          caseDateEncrypted: 'encrypted-date',
          notaryIdEncrypted: 'encrypted-notary',
          isCloudSynced: true,
          encryptedPayload: 'ciphertext',
        }),
      });

      const conflictResponse = await POST(makeRequest());
      expect(conflictConfig?.setWhere).toBeDefined();
      expect(conflictResponse.status).toBe(409);

      const ownCaseResponse = await POST(makeRequest());
      expect(ownCaseResponse.status).toBe(200);
      await expect(ownCaseResponse.json()).resolves.toMatchObject({ success: true, id: 'same-case-id' });
    } finally {
      vi.doUnmock('@/lib/auth/session');
      vi.doUnmock('@/lib/db/client');
      vi.resetModules();
    }
  });
});


describe('Algerian Family Code inheritance regressions (Arts. 156, 158, 176)', () => {
  const present = (heirId: string, count = 1) => ({
    heirId,
    count,
    isPresent: true,
  });

  const amountFor = (results: Array<{ heirId: string; amount: number }>, heirId: string) =>
    results.find(result => result.heirId === heirId)?.amount ?? 0;

  it('applies Article 158 muqasama as two grandfather shares when only one full sister is present', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('grandfather'),
      present('full_sister'),
    ], 90000, 0, 0, 0);

    expect(amountFor(results, 'grandfather')).toBe(60000);
    expect(amountFor(results, 'full_sister')).toBe(30000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(90000);
  });

  it('compares Article 158 options for a grandfather with three full sisters and no other fixed-share heirs', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('grandfather'),
      present('full_sister', 3),
    ], 90000, 0, 0, 0);

    // Muqasama gives the grandfather 2/5; the sisters share the remaining 3/5.
    expect(amountFor(results, 'grandfather')).toBe(36000);
    expect(amountFor(results, 'full_sister')).toBe(54000);
    expect(results.find(result => result.heirId === 'full_sister')?.individuals?.map(item => item.amount))
      .toEqual([18000, 18000, 18000]);
  });

  it('does not give a sister asaba ma’a al-ghayr in the presence of a grandfather; Article 158 governs', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('daughter'),
      present('grandfather'),
      present('full_sister'),
    ], 120000, 0, 0, 0);

    // Daughter: 1/2; grandfather: best of 1/6, 1/3 of remainder, or muqasama
    // (2/3 of the 1/2 remainder); sister: the remaining 1/6.
    expect(amountFor(results, 'daughter')).toBe(60000);
    expect(amountFor(results, 'grandfather')).toBe(40000);
    expect(amountFor(results, 'full_sister')).toBe(20000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('does not assign negative sibling residue when Article 158 grandfather share causes awl', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('mother'),
      present('daughter'),
      present('grandfather'),
      present('full_brother'),
    ], 156000, 0, 0, 0);

    // Before the Awl adjustment, the fixed shares (including the grandfather's
    // statutory 1/6) exceed the estate. The brother is an asaba and receives
    // no negative residue; Awl proportionally reduces the fixed shares.
    expect(amountFor(results, 'husband')).toBe(36000);    // 3/13
    expect(amountFor(results, 'mother')).toBe(24000);   // 2/13
    expect(amountFor(results, 'daughter')).toBe(72000); // 6/13
    expect(amountFor(results, 'grandfather')).toBe(24000);// 2/13
    expect(amountFor(results, 'full_brother')).toBe(0);
    expect(results.every(result => result.amount >= 0)).toBe(true);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(156000);
  });

  it('recognizes the Article 176 mushtaraka when full siblings are represented only by a sister', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('mother'),
      present('maternal_siblings', 2),
      present('full_sister'),
    ], 90000, 0, 0, 0);

    expect(amountFor(results, 'husband')).toBe(45000);
    expect(amountFor(results, 'mother')).toBe(15000);
    expect(amountFor(results, 'maternal_siblings')).toBe(20000);
    expect(amountFor(results, 'full_sister')).toBe(10000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(90000);
  });

  it('counts siblings who are barred from inheritance for the mother reduction under Article 148', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('mother'),
      present('father'),
      {
        heirId: 'full_brother',
        count: 2,
        isPresent: true,
        isImpeded: true,
        impededIndexes: [true, true],
      },
    ], 120000, 0, 0, 0);

    // The father blocks the two brothers from inheriting, but Article 148
    // expressly says "ولو لم يرثوا": their original headcount still reduces
    // the mother's share from 1/3 to 1/6.
    expect(amountFor(results, 'mother')).toBe(20000);
    expect(amountFor(results, 'father')).toBe(100000);
    expect(amountFor(results, 'full_brother')).toBe(0);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('does not use the whole-estate one-third option when a husband is a fixed-share heir (Article 158)', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('grandfather'),
      present('full_brother', 4),
    ], 120000, 0, 0, 0);

    // Husband: 1/2; grandfather: best of 1/6 (=20k), 1/3 of remainder (=20k),
    // or muqasama (=12k). The whole-estate 1/3 (=40k) is not an option here.
    expect(amountFor(results, 'husband')).toBe(60000);
    expect(amountFor(results, 'grandfather')).toBe(20000);
    expect(amountFor(results, 'full_brother')).toBe(40000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('retains the whole-estate one-third option when no fixed-share heir exists (Article 158)', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('grandfather'),
      present('full_brother', 4),
    ], 120000, 0, 0, 0);

    // Without fixed-share heirs, one third of the whole estate beats muqasama.
    expect(amountFor(results, 'grandfather')).toBe(40000);
    expect(amountFor(results, 'full_brother')).toBe(80000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('applies Article 175 akdariyya to a paternal sister as expressly stated in the statute', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('mother'),
      present('grandfather'),
      present('paternal_sister'),
    ], 270000, 0, 0, 0);

    expect(amountFor(results, 'husband')).toBe(90000);       // 9/27
    expect(amountFor(results, 'mother')).toBe(60000);        // 6/27
    expect(amountFor(results, 'grandfather')).toBe(80000);   // 8/27
    expect(amountFor(results, 'paternal_sister')).toBe(40000);// 4/27
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(270000);
  });

  it('applies Article 177 gharawayn for a husband and both parents', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('mother'),
      present('father'),
    ], 120000, 0, 0, 0);

    expect(amountFor(results, 'husband')).toBe(60000); // 1/2
    expect(amountFor(results, 'mother')).toBe(20000);  // 1/3 of remainder
    expect(amountFor(results, 'father')).toBe(40000);  // residue
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('applies Article 177 gharawayn for a wife and both parents', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      present('mother'),
      present('father'),
    ], 120000, 0, 0, 0);

    expect(amountFor(results, 'wife')).toBe(30000);   // 1/4
    expect(amountFor(results, 'mother')).toBe(30000);// 1/3 of remainder
    expect(amountFor(results, 'father')).toBe(60000);// residue
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(120000);
  });

  it('applies Article 178 mubahala through awl: husband, mother and full sister', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('mother'),
      present('full_sister'),
    ], 240000, 0, 0, 0);

    expect(amountFor(results, 'husband')).toBe(90000);    // 3/8
    expect(amountFor(results, 'full_sister')).toBe(90000);// 3/8
    expect(amountFor(results, 'mother')).toBe(60000);    // 2/8
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(240000);
    expect(results.some(result => result.calculationType === 'awl')).toBe(true);
  });

  it('applies Article 179 minbariya through awl: wife, two daughters and both parents', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      present('daughter', 2),
      present('father'),
      present('mother'),
    ], 270000, 0, 0, 0);

    expect(amountFor(results, 'wife')).toBe(30000);     // 3/27
    expect(amountFor(results, 'daughter')).toBe(160000);// 16/27
    expect(amountFor(results, 'father')).toBe(40000);   // 4/27
    expect(amountFor(results, 'mother')).toBe(40000);   // 4/27
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(270000);
    expect(results.some(result => result.calculationType === 'awl')).toBe(true);
  });

  it('recognizes the Article 176 mushtaraka with an eligible grandmother instead of the mother', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('husband'),
      present('maternal_grandmother'),
      present('maternal_siblings', 2),
      present('full_sister'),
    ], 90000, 0, 0, 0);

    expect(amountFor(results, 'husband')).toBe(45000);
    expect(amountFor(results, 'maternal_grandmother')).toBe(15000);
    expect(amountFor(results, 'maternal_siblings')).toBe(20000);
    expect(amountFor(results, 'full_sister')).toBe(10000);
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(90000);
  });

  it('blocks Article 137 calculation when diyah/compensation is not confirmed as excluded', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى',
      hasMandatoryBequest: false,
      heirs: [
        present('wife'),
        {
          heirId: 'full_brother',
          count: 1,
          isPresent: true,
          isImpeded: true,
          impedimentReasonId: 'involuntary_killer',
        },
      ],
    }];

    const [result] = runInheritanceOrchestration([stages, 100000, 0, 0, 0]);
    expect(result.involuntaryKillerNeedsCompensationReview).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('keeps the accidental killer eligible for ordinary estate money after Article 137 compensation is excluded', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى',
      hasMandatoryBequest: false,
      confirmedDiyahExcluded: true,
      heirs: [
        present('wife'),
        {
          heirId: 'full_brother',
          count: 1,
          isPresent: true,
          isImpeded: true,
          impedimentReasonId: 'involuntary_killer',
        },
      ],
    }];

    const [result] = runInheritanceOrchestration([stages, 100000, 0, 0, 0]);
    expect(result.involuntaryKillerNeedsCompensationReview).toBe(false);
    expect(amountFor(result.results, 'wife')).toBe(25000);
    expect(amountFor(result.results, 'full_brother')).toBe(75000);
  });

  it('blocks sequential inheritance when two deaths have no proven order under Article 129', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'وفاتان في حادث واحد دون ثبوت السابق',
      hasMandatoryBequest: false,
      deathOrderUncertain: true,
      heirs: [present('son'), present('daughter')],
    }];

    const [result] = runInheritanceOrchestration([stages, 180000, 0, 0, 0]);
    expect(result.deathOrderNeedsManualReview).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('marks a stage with a minor heir as requiring judicial partition under Article 181', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      hasMinorHeir: true,
      heirs: [present('son'), present('daughter')],
    }];

    const [result] = runInheritanceOrchestration([stages, 120000, 0, 0, 0]);
    expect(result.minorHeirNeedsJudicialPartition).toBe(true);
    // Shares remain available for preparation, but the UI blocks final exports.
    expect(amountFor(result.results, 'son')).toBeGreaterThan(0);
    expect(amountFor(result.results, 'daughter')).toBeGreaterThan(0);
  });

  it('calculates and withholds the share of one missing heir under Article 133', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      {
        heirId: 'son',
        count: 1,
        isPresent: true,
        missingPersonStatus: 'missing_presumed_alive',
      },
    ], 120000, 0, 0, 0);

    const wife = results.find(result => result.heirId === 'wife');
    const missingSon = results.find(result => result.heirId === 'son');
    expect(wife?.amount).toBe(15000); // 1/8 because the missing son is treated as alive
    expect(missingSon?.amount).toBe(105000);
    expect(missingSon?.isWithheld).toBe(true);
    expect(missingSon?.article).toBe(133);
    expect(missingSon?.reason).toContain('موقوف للمفقود');
  });

  it('blocks calculation when one missing person is not distinguishable within a multi-person heir group', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      {
        heirId: 'son',
        count: 2,
        isPresent: true,
        missingPersonStatus: 'missing_presumed_alive',
      },
    ], 120000, 0, 0, 0);

    expect(results).toHaveLength(1);
    expect(results[0].heirId).toBe('article_133_review');
    expect(results[0].amount).toBe(0);
  });

  it('flags a missing heir among a multi-person group for manual review in orchestration', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'root',
      deceasedName: 'المتوفى الأصلي',
      hasMandatoryBequest: false,
      heirs: [
        present('wife'),
        {
          heirId: 'son',
          count: 2,
          isPresent: true,
          missingPersonStatus: 'missing_presumed_alive',
        },
      ],
    }];

    const [result] = runInheritanceOrchestration([stages, 120000, 0, 0, 0]);
    expect(result.missingHeirNeedsManualReview).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('blocks direct Article 173 calculation while pregnancy outcome is pending', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      present('mother'),
      present('father'),
    ], 240000, 0, 0, 0, false, [], 'pending', true);

    expect(results).toHaveLength(1);
    expect(results[0].heirId).toBe('article_173_review');
    expect(results[0].amount).toBe(0);
    expect(results.some(result => result.heirId === 'wife' || result.heirId === 'mother' || result.heirId === 'father')).toBe(false);
  });

  it('adds a live-born male fetus to the heirs before calculating the estate under Article 173', async () => {
    const { calculateInheritance } = await import('../lib/inheritance/inheritance-calculator');
    const results = calculateInheritance([
      present('wife'),
      present('mother'),
      present('father'),
    ], 240000, 0, 0, 0, false, [], 'born_male', true);

    expect(amountFor(results, 'wife')).toBe(30000);   // 1/8
    expect(amountFor(results, 'mother')).toBe(40000); // 1/6
    expect(amountFor(results, 'father')).toBe(40000); // 1/6
    expect(amountFor(results, 'son')).toBe(130000);   // residue
    expect(results.reduce((sum, result) => sum + result.amount, 0)).toBe(240000);
  });

  it('withholds all automatic stage results for disputed or multiple pregnancies', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const cases: MunasakhatStage[] = [
      {
        id: 'disputed-pregnancy',
        deceasedName: 'المتوفى مع حمل متنازع فيه',
        hasMandatoryBequest: false,
        hasUnbornHeir: true,
        unbornOutcome: 'born_male',
        pregnancyDisputed: true,
        heirs: [present('wife'), present('mother'), present('father')],
      },
      {
        id: 'multiple-pregnancy',
        deceasedName: 'المتوفى مع حمل متعدد',
        hasMandatoryBequest: false,
        hasUnbornHeir: true,
        unbornOutcome: 'twins_male_female',
        heirs: [present('wife'), present('mother'), present('father')],
      },
    ];

    const results = runInheritanceOrchestration([cases, 240000, 0, 0, 0]);
    expect(results.every(stage => stage.pregnancyNeedsManualReview)).toBe(true);
    expect(results.every(stage => stage.results.length === 0)).toBe(true);
  });

  it('flags an unresolved pregnancy stage and blocks its automatic result list under Article 173', async () => {
    const { runInheritanceOrchestration } = await import('../lib/inheritance/stage-orchestrator');
    const stages: MunasakhatStage[] = [{
      id: 'pending-pregnancy',
      deceasedName: 'المتوفى مع حمل قائم',
      hasMandatoryBequest: false,
      hasUnbornHeir: true,
      unbornOutcome: 'pending',
      heirs: [present('wife'), present('mother'), present('father')],
    }];

    const [result] = runInheritanceOrchestration([stages, 240000, 0, 0, 0]);
    expect(result.pregnancyNeedsManualReview).toBe(true);
    expect(result.results).toEqual([]);
  });

});
