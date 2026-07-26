import { describe, it, expect } from 'vitest';
import { isHeirExcludedInMunasakhat } from '../data/munasakhat-exclusions';

describe('Munasakhat Exclusions Data Matrix Tests', () => {
  it('excludes parents and grand-parents when deceased secondary heir is a descendant (son/daughter)', () => {
    const resSonFather = isHeirExcludedInMunasakhat('father', 'son');
    expect(resSonFather.excluded).toBe(true);
    expect(resSonFather.reason).toContain('مستبعد: الأصول مشتركة مع المسألة الأم');

    const resDaughterMother = isHeirExcludedInMunasakhat('mother', 'daughter');
    expect(resDaughterMother.excluded).toBe(true);
  });

  it('excludes siblings when parentHeirId is a sibling', () => {
    const resFullBrother = isHeirExcludedInMunasakhat('full_brother', 'full_brother');
    expect(resFullBrother.excluded).toBe(true);
    expect(resFullBrother.reason).toContain('مستبعد: الإخوة/الأخوات هم ورثة في الأساس');
  });

  it('excludes descendant of deceased original when parentHeirId is a father or mother', () => {
    const resFatherSon = isHeirExcludedInMunasakhat('son', 'father');
    expect(resFatherSon.excluded).toBe(true);
    expect(resFatherSon.reason).toContain('مستبعد: الفرع النازل هو المتوفى الأصلي');
  });

  it('excludes spouse inheritance loop (husband/wife)', () => {
    const resSpouse = isHeirExcludedInMunasakhat('husband', 'wife');
    expect(resSpouse.excluded).toBe(true);
    expect(resSpouse.reason).toContain('مستبعد: استنتاج غير منطقي');
  });

  it('allows non-excluded heir combinations', () => {
    const resWifeSon = isHeirExcludedInMunasakhat('wife', 'son');
    expect(resWifeSon.excluded).toBe(false);
    expect(resWifeSon.reason).toBe('');
  });
});
