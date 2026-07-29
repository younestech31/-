import { describe, it, expect } from 'vitest';
import { calculateInheritance, HeirPresence } from '../lib/inheritance/inheritance-calculator';

describe('Classical Cases Golden Regression Fixtures (Articles 175-179)', () => {
  it('Minbariyya (Art. 179): Wife, 2 Daughters, Father, Mother', () => {
    // Estate 270,000 -> Base 24 -> Awl to 27
    // Wife 3/27, Daughters 16/27, Father 4/27, Mother 4/27
    const heirs: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'daughter', count: 2, isPresent: true },
      { heirId: 'father', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 270000, 0, 0, 0, false, []);
    expect(results[0].problemBase).toBe(27);
    expect(results[0].calculationType).toBe('awl');

    const wife = results.find(r => r.heirId === 'wife');
    const daughters = results.find(r => r.heirId === 'daughter');
    const father = results.find(r => r.heirId === 'father');
    const mother = results.find(r => r.heirId === 'mother');

    expect(wife?.amount).toBe(30000); // 3/27 of 270k
    expect(daughters?.amount).toBe(160000); // 16/27 of 270k
    expect(father?.amount).toBe(40000); // 4/27 of 270k
    expect(mother?.amount).toBe(40000); // 4/27 of 270k
  });

  it('Mubahala (Art. 178): Husband, Mother, Full Sister', () => {
    // Estate 240,000 -> Base 6 -> Awl to 8
    // Husband 3/8, Full Sister 3/8, Mother 2/8
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'full_sister', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 240000, 0, 0, 0, false, []);
    expect(results[0].problemBase).toBe(8);
    expect(results[0].calculationType).toBe('awl');

    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const fullSister = results.find(r => r.heirId === 'full_sister');

    expect(husband?.amount).toBe(90000); // 3/8 of 240k
    expect(fullSister?.amount).toBe(90000); // 3/8 of 240k
    expect(mother?.amount).toBe(60000); // 2/8 of 240k
  });

  it('Gharrawayn (Art. 177): Husband + Father + Mother', () => {
    // Estate 600,000: Husband 1/2 (300k), Mother 1/3 of remainder (1/6 total = 100k), Father residue (2/6 total = 200k)
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'father', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 600000, 0, 0, 0, false, []);
    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const father = results.find(r => r.heirId === 'father');

    expect(husband?.amount).toBe(300000);
    expect(mother?.amount).toBe(100000);
    expect(father?.amount).toBe(200000);
  });

  it('Mushtaraka / Himariyya (Art. 176): Husband, Mother, Maternal Siblings, Full Brother', () => {
    // Husband 1/2, Mother 1/6, Maternal siblings & Full brothers share 1/3
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'maternal_siblings', count: 2, isPresent: true },
      { heirId: 'full_brother', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 600000, 0, 0, 0, false, []);
    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const maternalSiblings = results.find(r => r.heirId === 'maternal_siblings');
    const fullBrother = results.find(r => r.heirId === 'full_brother');

    expect(husband?.amount).toBe(300000); // 1/2
    expect(mother?.amount).toBe(100000); // 1/6
    expect(maternalSiblings?.amount).toBeCloseTo(133333.33, 0); // 2/9 approx
    expect(fullBrother?.amount).toBeCloseTo(66666.67, 0); // 1/9 approx
  });

  it('Akdariyya (Art. 175): Husband, Mother, Grandfather, Full Sister', () => {
    // Estate 270,000 -> Awl base 9, corrected to 27
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'grandfather', count: 1, isPresent: true },
      { heirId: 'full_sister', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 270000, 0, 0, 0, false, []);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    const husband = results.find(r => r.heirId === 'husband');
    expect(husband?.amount).toBe(90000); // 9/27 of 270k = 90k
  });
});
