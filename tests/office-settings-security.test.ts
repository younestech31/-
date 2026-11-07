import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OFFICE_SETTINGS,
  getPersistedOfficeSettings,
} from '@/lib/inheritance/document-branding';

describe('office settings secret persistence', () => {
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
