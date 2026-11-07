import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OFFICE_SETTINGS,
  getNotarialAttestationData,
  getPersistedOfficeSettings,
} from '@/lib/inheritance/document-branding';

describe('office settings secret persistence', () => {
  it('never treats a user-editable local flag as proof of notary accreditation', () => {
    const data = getNotarialAttestationData({
      ...DEFAULT_OFFICE_SETTINGS,
      notaryNameAr: 'مكتب اختبار',
      notaryLicenseVerified: true,
    });

    expect(data.title).toContain('غير مصادق عليه');
    expect(data.attestationText).toContain('لا يُعدّ عقداً رسمياً');
    expect(data.attestationText).not.toContain('أشهد أنا الموثق');
    expect(data.signatureBoxTitle).toBe('المراجعة والتحقق الخارجي');
  });

  it('removes legacy server-only settings from persisted office settings', () => {
    const settings = {
      ...DEFAULT_OFFICE_SETTINGS,
      notaryNameAr: 'مكتب الاختبار',
      cloudSyncPassphrase: 'a-very-long-private-passphrase',
      auditLedgerOptIn: true,
    };

    const persisted = getPersistedOfficeSettings(settings);

    expect(persisted).toMatchObject({ notaryNameAr: 'مكتب الاختبار' });
    expect(persisted).not.toHaveProperty('cloudSyncPassphrase');
    expect(persisted).not.toHaveProperty('auditLedgerOptIn');
    expect(JSON.stringify(persisted)).not.toContain('a-very-long-private-passphrase');
  });
});
