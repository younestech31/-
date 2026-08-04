import { describe, it, expect } from 'vitest';
import { LEGAL_INTERPRETATIONS_REGISTRY, getInterpretationSetting } from '@/lib/inheritance/legal-interpretations-registry';

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

  it('should reference getInterpretationSetting correctly', () => {
    expect(typeof getInterpretationSetting('IMPEDED_SIBLINGS_REDUCTION')).toBe('boolean');
    expect(typeof getInterpretationSetting('AKDARIYYA_PATERNAL_SISTER')).toBe('boolean');
  });

  it('should measurably change getInterpretationSetting when flipping defaultSetting for every key', () => {
    Object.keys(LEGAL_INTERPRETATIONS_REGISTRY).forEach(key => {
      const entry = LEGAL_INTERPRETATIONS_REGISTRY[key];
      const original = entry.defaultSetting;

      entry.defaultSetting = true;
      const outTrue = getInterpretationSetting(key);

      entry.defaultSetting = false;
      const outFalse = getInterpretationSetting(key);

      entry.defaultSetting = original; // restore

      expect(outTrue).not.toEqual(outFalse);
    });
  });
});
