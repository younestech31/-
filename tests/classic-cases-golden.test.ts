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
    const mother = results.find(r => r.heirId === 'mother');
    const fullSister = results.find(r => r.heirId === 'full_sister');
    const grandfather = results.find(r => r.heirId === 'grandfather');

    expect(husband?.amount).toBe(90000); // 9/27 of 270k = 90k
    expect(mother?.amount).toBe(60000); // 6/27 of 270k = 60k
    expect(fullSister?.amount).toBe(40000); // 4/27 of 270k = 40k
    expect(grandfather?.amount).toBe(80000); // 8/27 of 270k = 80k
  });

  it('Akdariyya paternal-sister substitution (AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER)', () => {
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'grandfather', count: 1, isPresent: true },
      { heirId: 'paternal_sister', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 270000, 0, 0, 0, false, []);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);

    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const paternalSister = results.find(r => r.heirId === 'paternal_sister');
    const grandfather = results.find(r => r.heirId === 'grandfather');

    expect(husband?.amount).toBe(90000); // 9/27 of 270k = 90k
    expect(mother?.amount).toBe(60000); // 6/27 of 270k = 60k
    expect(paternalSister?.amount).toBe(40000); // 4/27 of 270k = 40k
    expect(grandfather?.amount).toBe(80000); // 8/27 of 270k = 80k
  });

  it('Marwaniyyah: Husband, 2 Full Sisters, 2 Maternal Siblings', () => {
    // Estate 180,000 -> Base 6 -> Awl to 9
    // Husband 3/9 (60k), 2 Full Sisters 4/9 (80k), 2 Maternal Siblings 2/9 (40k)
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'full_sister', count: 2, isPresent: true },
      { heirId: 'maternal_siblings', count: 2, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 180000, 0, 0, 0, false, []);
    expect(results[0].problemBase).toBe(9);
    expect(results[0].calculationType).toBe('awl');

    const husband = results.find(r => r.heirId === 'husband');
    const fullSister = results.find(r => r.heirId === 'full_sister');
    const maternalSiblings = results.find(r => r.heirId === 'maternal_siblings');

    expect(husband?.amount).toBe(60000); // 3/9 of 180k
    expect(fullSister?.amount).toBe(80000); // 4/9 of 180k
    expect(maternalSiblings?.amount).toBe(40000); // 2/9 of 180k
  });

  it('Kharqaa (Article 158): Mother, Grandfather, Full Sister', () => {
    // Estate 180,000 -> Mother 1/3 (60k); grandfather compares 1/6 (30k),
    // 1/3 of the remainder (40k), and muqasama (80k); sister receives 40k.
    const heirs: HeirPresence[] = [
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'grandfather', count: 1, isPresent: true },
      { heirId: 'full_sister', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 180000, 0, 0, 0, false, []);
    const mother = results.find(r => r.heirId === 'mother');
    const grandfather = results.find(r => r.heirId === 'grandfather');
    const fullSister = results.find(r => r.heirId === 'full_sister');

    expect(mother?.amount).toBe(60000); // 1/3 (60k)
    expect(fullSister?.amount).toBe(40000); // remainder after grandfather's preferred muqasama
    expect(grandfather?.amount).toBe(80000); // muqasama is best under Article 158
  });

  it('Dinariyyah: Wife, Mother, 2 Daughters, Paternal Sister', () => {
    // Estate 240,000 -> Base 24 (Wife 1/8=30k, Mother 1/6=40k, 2 Daughters 2/3=160k, Paternal Sister residue=10k)
    const heirs: HeirPresence[] = [
      { heirId: 'wife', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'daughter', count: 2, isPresent: true },
      { heirId: 'paternal_sister', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 240000, 0, 0, 0, false, []);
    const wife = results.find(r => r.heirId === 'wife');
    const mother = results.find(r => r.heirId === 'mother');
    const daughters = results.find(r => r.heirId === 'daughter');
    const paternalSister = results.find(r => r.heirId === 'paternal_sister');

    expect(wife?.amount).toBe(30000);
    expect(mother?.amount).toBe(40000);
    expect(daughters?.amount).toBe(160000);
    expect(paternalSister?.amount).toBe(10000);
  });

  it('Yatimah / Al-Gharraa (Art. 175): Husband, Mother, Full Sister, Grandfather', () => {
    // Resolved as Akdariyya in Algerian Family Code -> Estate 270,000 -> Base 27
    // Husband 90k, Mother 60k, Grandfather 80k, Full Sister 40k
    const heirs: HeirPresence[] = [
      { heirId: 'husband', count: 1, isPresent: true },
      { heirId: 'mother', count: 1, isPresent: true },
      { heirId: 'full_sister', count: 1, isPresent: true },
      { heirId: 'grandfather', count: 1, isPresent: true },
    ];
    const results = calculateInheritance(heirs, 270000, 0, 0, 0, false, []);
    const husband = results.find(r => r.heirId === 'husband');
    const mother = results.find(r => r.heirId === 'mother');
    const fullSister = results.find(r => r.heirId === 'full_sister');
    const grandfather = results.find(r => r.heirId === 'grandfather');

    expect(husband?.amount).toBe(90000);
    expect(mother?.amount).toBe(60000);
    expect(fullSister?.amount).toBe(40000);
    expect(grandfather?.amount).toBe(80000);
  });
});
