import { describe, it, expect } from 'vitest';
import { resolveBlocking, BlockingContext } from '../lib/inheritance/blocking-resolver';

describe('Blocking Resolver Tests (Hajb)', () => {
  it('blocks grandson when son is present', () => {
    const ctx: BlockingContext = {
      has: (id: string) => id === 'son',
      getCount: (id: string) => (id === 'son' ? 1 : 0),
      hasDescendant: true,
      siblingsCount: 0,
    };

    const result = resolveBlocking('son_son', ctx);
    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('الابن');
  });

  it('blocks paternal siblings when full sister is asaba maa ghayr with female direct descendant', () => {
    const ctx: BlockingContext = {
      has: (id: string) => ['full_sister', 'daughter'].includes(id),
      getCount: (_id: string) => 1,
      hasDescendant: true,
      hasFemaleDirectDescendant: true,
      siblingsCount: 1,
    };

    const resultPaternalBrother = resolveBlocking('paternal_brother', ctx);
    expect(resultPaternalBrother.isBlocked).toBe(true);
    expect(resultPaternalBrother.reason).toContain('محجوب بالأخت الشقيقة العصبة مع الغير');
    expect(resultPaternalBrother.article).toBe(164);
  });

  it('blocks paternal sister when two full sisters complete two-thirds', () => {
    const ctx: BlockingContext = {
      has: (id: string) => id === 'full_sister',
      getCount: (id: string) => (id === 'full_sister' ? 2 : 0),
      hasDescendant: false,
      siblingsCount: 2,
    };

    const result = resolveBlocking('paternal_sister', ctx);
    expect(result.isBlocked).toBe(true);
    expect(result.article).toBe(164);
  });

  it('does NOT block paternal sister when two full sisters and paternal brother are present', () => {
    const ctx: BlockingContext = {
      has: (id: string) => id === 'full_sister' || id === 'paternal_brother',
      getCount: (id: string) => (id === 'full_sister' ? 2 : 0),
      hasDescendant: false,
      siblingsCount: 3,
    };

    const result = resolveBlocking('paternal_sister', ctx);
    expect(result.isBlocked).toBe(false);
  });

  it('blocks maternal siblings when direct progeny or father is present', () => {
    const ctx: BlockingContext = {
      has: (id: string) => id === 'father',
      getCount: (id: string) => (id === 'father' ? 1 : 0),
      hasDescendant: false,
      siblingsCount: 1,
    };

    const result = resolveBlocking('maternal_siblings', ctx);
    expect(result.isBlocked).toBe(true);
  });
});
