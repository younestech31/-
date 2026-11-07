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
    };

    const priorAgnate = [{ heirId: 'full_brother', amount: 50000 }] as unknown as Parameters<typeof resolveNoHeirsPolicy>[2];
    const result = resolveNoHeirsPolicy(stage, 150000, priorAgnate);
    expect(result.policy).toBe('treasury');
    expect(result.amount).toBe(150000);
    expect(result.messageAr).toContain('تؤول تركة (أحمد المتوفى ثانيا) إلى الخزينة العامة');
    expect(result.redistributeTo).toBeUndefined();
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

  it('preserves Article 171 prior-gift metadata through the orchestration layer', async () => {
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
    expect(result.results.find(row => row.heirId === 'mandatory_bequest')?.amount).toBe(350000);
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
});
