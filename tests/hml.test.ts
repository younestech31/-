import { describe, it, expect } from 'vitest';
import { calculateInheritance, HeirPresence } from '../lib/inheritance/inheritance-calculator';

describe('Al-Haml (Unborn Child) Tests - Articles 173-174', () => {
  it('blocks automatic distribution while the Article 173 pregnancy outcome is pending', () => {
    // Wife + Unborn Heir + Daughter
    const presence: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'daughter', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(
      presence,
      1200000,
      0,
      0,
      0,
      false,
      [],
      'pending',
      true
    );

    const review = results.find(r => r.heirId === 'article_173_review');
    expect(review).toBeDefined();
    expect(review!.amount).toBe(0);
    expect(review!.article).toBe(173);
    expect(review!.reason).toContain('الحمل غير محسوم');
    expect(results.some(r => r.heirId === 'unborn_withholding')).toBe(false);
    expect(results.some(r => r.heirId === 'wife' || r.heirId === 'daughter')).toBe(false);
  });

  it('correctly resolves pending haml to born_male', () => {
    const presence: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'daughter', count: 1, isPresent: true },
    ];

    const results = calculateInheritance(
      presence,
      1200000,
      0,
      0,
      0,
      false,
      [],
      'born_male',
      true
    );

    const son = results.find(r => r.heirId === 'son');
    const daughter = results.find(r => r.heirId === 'daughter');
    expect(son).toBeDefined();
    expect(son!.amount).toBeGreaterThan(0);
    expect(daughter!.amount).toBeGreaterThan(0);
  });
});
