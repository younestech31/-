import type { Metadata } from 'next';
import LicenseManager from '@/components/licensing/LicenseManager';

export const metadata: Metadata = {
  title: 'الترخيص والتفعيل',
  description: 'إدارة ترخيص مواريث وتفعيل ملف Pro محلياً.',
  robots: { index: false, follow: false },
};

export default function LicensePage() {
  return <LicenseManager />;
}
