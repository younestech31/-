import { describe, it, expect } from 'vitest';
import {
  isHeirExcludedInMunasakhat,
  MUNASAKHAT_REVIEW_RULES,
  validateMunasakhatStageExclusions,
} from '../data/munasakhat-exclusions';
import { runInheritanceOrchestration } from '../lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '../components/inheritance/InheritanceCalculator';

describe('Munasakhat relationship review rules', () => {
  it('keeps legacy category rules documented as review prompts with source notes', () => {
    expect(MUNASAKHAT_REVIEW_RULES.length).toBeGreaterThan(0);
    MUNASAKHAT_REVIEW_RULES.forEach(rule => {
      expect(rule.parentHeirId).toBeTruthy();
      expect(rule.excludedHeirIds.length).toBeGreaterThan(0);
      expect(rule.source.trim().length).toBeGreaterThan(10);
    });
  });

  it('flags a mother in a son estate for review without automatically excluding her', () => {
    const assessment = isHeirExcludedInMunasakhat('mother', 'son');
    expect(assessment.excluded).toBe(false);
    expect(assessment.requiresReview).toBe(true);
    expect(assessment.reason).toContain('مراجعة فردية');
    expect(assessment.source).toContain('ليست قاعدة استبعاد');
  });

  it('flags siblings in a sibling estate for review without automatically excluding them', () => {
    const assessment = isHeirExcludedInMunasakhat('full_brother', 'full_brother');
    expect(assessment.excluded).toBe(false);
    expect(assessment.requiresReview).toBe(true);
  });

  it('flags descendant categories after an ascendant death for individual review', () => {
    const assessment = isHeirExcludedInMunasakhat('son', 'father');
    expect(assessment.excluded).toBe(false);
    expect(assessment.requiresReview).toBe(true);
  });

  it('keeps the other-union context as a review prompt rather than an automatic decision', () => {
    const assessment = isHeirExcludedInMunasakhat('son', 'mother', true);
    expect(assessment.excluded).toBe(false);
    expect(assessment.requiresReview).toBe(true);
    expect(assessment.reason).toContain('اتحاد آخر');
  });

  it('validates unreviewed and acknowledged relationships separately', () => {
    const stage = {
      deceasedHeirId: 'son',
      heirs: [{ heirId: 'mother', isPresent: true, count: 1 }],
    };
    const pending = validateMunasakhatStageExclusions(stage, [], 1);
    expect(pending.hasUnacknowledgedExclusions).toBe(true);
    expect(pending.unacknowledgedExclusions).toHaveLength(1);

    const acknowledged = validateMunasakhatStageExclusions(
      { ...stage, acknowledgedExclusions: ['mother'] },
      [],
      1
    );
    expect(acknowledged.hasUnacknowledgedExclusions).toBe(false);
    expect(acknowledged.acknowledgedExclusions).toHaveLength(1);
  });

  it('validates legacy heirPresence cases using parentHeirId when deceasedHeirId is absent', () => {
    const legacyStage = {
      parentHeirId: 'son',
      heirPresence: {
        mother: { heirId: 'mother', isPresent: true, count: 1 },
      },
    };
    const validation = validateMunasakhatStageExclusions(legacyStage, null, 1);

    expect(validation.hasUnacknowledgedExclusions).toBe(true);
    expect(validation.unacknowledgedExclusions).toHaveLength(1);
    expect(validation.unacknowledgedExclusions[0].heirId).toBe('mother');
  });

  function buildStages(acknowledgedExclusions: string[] = []): MunasakhatStage[] {
    return [
      {
        id: 'root',
        deceasedName: 'المتوفى الأصلي',
        deceasedNameAr: 'المتوفى الأصلي',
        deceasedGender: 'male',
        hasMandatoryBequest: false,
        heirs: [
          { heirId: 'wife', count: 1, isPresent: true },
          { heirId: 'son', count: 1, isPresent: true },
        ],
      },
      {
        id: 'stage-secondary',
        deceasedName: 'الابن المتوفى',
        deceasedNameAr: 'الابن المتوفى',
        deceasedGender: 'male',
        deceasedHeirId: 'son',
        parentHeirId: 'son',
        parentStageId: 'root',
        parentHeirIndex: 0,
        inheritedAmount: 120000,
        hasMandatoryBequest: false,
        acknowledgedExclusions,
        heirs: [{ heirId: 'mother', count: 1, isPresent: true }],
      },
    ];
  }

  it('keeps a potentially eligible shared mother in the secondary calculation pending review', () => {
    const stageResults = runInheritanceOrchestration([buildStages(), 100000, 0, 0, 0]);
    const secondary = stageResults[1];

    expect(secondary.excludedHeirWarnings?.some(warning => warning.heirId === 'mother')).toBe(true);
    expect(secondary.results.some(result => result.heirId === 'mother')).toBe(true);
    expect(secondary.hasUnverifiedOverride).toBe(false);
  });

  it('marks an acknowledged relationship match as non-exportable', () => {
    const stageResults = runInheritanceOrchestration([
      buildStages(['mother']),
      100000,
      0,
      0,
      0,
    ]);
    const secondary = stageResults[1];

    expect(secondary.results.some(result => result.heirId === 'mother')).toBe(true);
    expect(secondary.hasUnverifiedOverride).toBe(true);
  });
});
