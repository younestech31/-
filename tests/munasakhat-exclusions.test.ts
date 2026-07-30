import { describe, it, expect } from 'vitest';
import { isHeirExcludedInMunasakhat, MUNASAKHAT_EXCLUSION_RULES } from '../data/munasakhat-exclusions';

describe('Munasakhat Exclusions Data Matrix & Source Citations Tests', () => {
  it('requires every rule in MUNASAKHAT_EXCLUSION_RULES to have a non-empty source citation', () => {
    expect(MUNASAKHAT_EXCLUSION_RULES.length).toBeGreaterThan(0);
    MUNASAKHAT_EXCLUSION_RULES.forEach(rule => {
      expect(rule.parentHeirId).toBeDefined();
      expect(typeof rule.parentHeirId).toBe('string');
      expect(rule.excludedHeirIds.length).toBeGreaterThan(0);
      expect(rule.source).toBeDefined();
      expect(typeof rule.source).toBe('string');
      expect(rule.source.trim().length).toBeGreaterThan(10);
    });
  });

  it('excludes parents and grand-parents when deceased secondary heir is a descendant (son/daughter)', () => {
    const resSonFather = isHeirExcludedInMunasakhat('father', 'son');
    expect(resSonFather.excluded).toBe(true);
    expect(resSonFather.reason).toContain('مستبعد: الأصول مشتركة مع المسألة الأم');
    expect(resSonFather.source.length).toBeGreaterThan(5);

    const resDaughterMother = isHeirExcludedInMunasakhat('mother', 'daughter');
    expect(resDaughterMother.excluded).toBe(true);
    expect(resDaughterMother.source.length).toBeGreaterThan(5);
  });

  it('excludes siblings when parentHeirId is a sibling', () => {
    const resFullBrother = isHeirExcludedInMunasakhat('full_brother', 'full_brother');
    expect(resFullBrother.excluded).toBe(true);
    expect(resFullBrother.reason).toContain('مستبعد: الإخوة/الأخوات هم ورثة في الأساس');
    expect(resFullBrother.source.length).toBeGreaterThan(5);
  });

  it('excludes descendant of deceased original when parentHeirId is a father or mother', () => {
    const resFatherSon = isHeirExcludedInMunasakhat('son', 'father');
    expect(resFatherSon.excluded).toBe(true);
    expect(resFatherSon.reason).toContain('مستبعد: الفرع النازل هو المتوفى الأصلي');
    expect(resFatherSon.source.length).toBeGreaterThan(5);
  });

  it('excludes spouse inheritance loop (husband/wife)', () => {
    const resSpouse = isHeirExcludedInMunasakhat('husband', 'wife');
    expect(resSpouse.excluded).toBe(true);
    expect(resSpouse.reason).toContain('مستبعد: استنتاج غير منطقي');
    expect(resSpouse.source.length).toBeGreaterThan(5);
  });

  it('allows non-excluded heir combinations', () => {
    const resWifeSon = isHeirExcludedInMunasakhat('wife', 'son');
    expect(resWifeSon.excluded).toBe(false);
    expect(resWifeSon.reason).toBe('');
    expect(resWifeSon.source).toBe('');
  });
});
