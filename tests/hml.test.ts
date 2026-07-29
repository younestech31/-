import { describe, it, expect } from 'vitest';
import { calculateInheritance, HeirPresence } from '../lib/inheritance/inheritance-calculator';

describe('Al-Haml (Unborn Child) Tests - Articles 173-174', () => {
  it('withholds larger of son or daughter share when status is pending', () => {
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

    const unborn = results.find(r => r.heirId === 'unborn_withholding');
    expect(unborn).toBeDefined();
    expect(unborn!.amount).toBeGreaterThan(0);
    expect(unborn!.article).toBe(173);
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
