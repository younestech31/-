import { describe, it, expect } from 'vitest';
import { getNotarialAttestationData, DEFAULT_OFFICE_SETTINGS, OfficeSettings } from '@/lib/inheritance/document-branding';

describe('Document Fraud Prevention and Notarial Attestation Gating (C4)', () => {
  it('does NOT generate first-person attestation when isOfficialMode is true but notaryLicenseVerified is false or omitted', () => {
    const unverifiedSettings: OfficeSettings = {
      ...DEFAULT_OFFICE_SETTINGS,
      isOfficialMode: true,
      notaryLicenseVerified: false,
    };

    const attestationData = getNotarialAttestationData(unverifiedSettings, null, 'ar');

    expect(attestationData.attestationText).not.toContain('أشهد أنا الموثق');
    expect(attestationData.attestationText).toContain('منصة مواريث');
    expect(attestationData.title).not.toContain('إشهاد المصادقة');
    expect(attestationData.title).toContain('تقرير حساب آلي — غير مصادق عليه');
    expect(attestationData.signatureBoxTitle).toBe('المراجعة والتحقق الخارجي');
  });

  it('never generates a first-person attestation from a user-editable verification flag', () => {
    const verifiedSettings: OfficeSettings = {
      ...DEFAULT_OFFICE_SETTINGS,
      isOfficialMode: true,
      notaryLicenseVerified: true,
    };

    const attestationData = getNotarialAttestationData(verifiedSettings, null, 'ar');

    expect(attestationData.attestationText).toContain('لا يُعدّ عقداً رسمياً');
    expect(attestationData.attestationText).not.toContain('أشهد أنا الموثق');
    expect(attestationData.title).toContain('غير مصادق عليه');
    expect(attestationData.signatureBoxTitle).toBe('المراجعة والتحقق الخارجي');
  });

  it('does NOT use "جنائي" wording in attestation titles or text', () => {
    const verifiedSettings: OfficeSettings = {
      ...DEFAULT_OFFICE_SETTINGS,
      isOfficialMode: true,
      notaryLicenseVerified: true,
    };

    const attestationData = getNotarialAttestationData(verifiedSettings, null, 'ar');

    expect(attestationData.title).not.toContain('الجنائية');
    expect(attestationData.title).not.toContain('جنائي');
    expect(attestationData.attestationText).not.toContain('جنائية');
  });
});
