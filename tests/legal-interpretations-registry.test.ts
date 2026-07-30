import { describe, it, expect } from 'vitest';
import { LEGAL_INTERPRETATIONS_REGISTRY } from '@/lib/inheritance/legal-interpretations-registry';
import { IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION, AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER } from '@/lib/inheritance/inheritance-calculator';

describe('Legal Interpretations Registry Tests', () => {
  it('should contain registry entries for all interpretive decisions in the calculation engine', () => {
    expect(LEGAL_INTERPRETATIONS_REGISTRY['IMPEDED_SIBLINGS_REDUCTION']).toBeDefined();
    expect(LEGAL_INTERPRETATIONS_REGISTRY['AKDARIYYA_PATERNAL_SISTER']).toBeDefined();
    expect(LEGAL_INTERPRETATIONS_REGISTRY['MUNASAKHAT_NO_HEIRS_TREASURY']).toBeDefined();
    expect(LEGAL_INTERPRETATIONS_REGISTRY['GRANDFATHER_AND_SIBLINGS_MALIKI']).toBeDefined();
    expect(LEGAL_INTERPRETATIONS_REGISTRY['MISSING_PERSON_DEAD_PRESUMPTION']).toBeDefined();
  });

  it('should have valid metadata fields for every entry', () => {
    Object.values(LEGAL_INTERPRETATIONS_REGISTRY).forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(entry.nameAr).toBeDefined();
      expect(entry.familyCodeArticles.length).toBeGreaterThan(0);
      expect(entry.fiqhSourceOrCircular.length).toBeGreaterThan(5);
      expect(entry.schoolOfThought).toBeDefined();
      expect(entry.lastReviewedBy).toBeDefined();
      expect(entry.lastReviewedDate).toBeDefined();
    });
  });

  it('should reference constants correctly', () => {
    expect(typeof IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION).toBe('boolean');
    expect(typeof AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER).toBe('boolean');
  });
});
