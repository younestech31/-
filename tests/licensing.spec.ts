import { test, expect } from '@playwright/test';

test.describe('Manual local license page', () => {
  test('shows local activation and pilot plans without calling application APIs', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) apiRequests.push(url.pathname);
    });

    await page.goto('/license');

    await expect(page.getByRole('heading', { name: 'الترخيص والتفعيل' })).toBeVisible();
    const keyNotConfigured = page.getByRole('heading', { name: 'خطط Pro ستتاح بعد تهيئة التوقيع' });
    const keyMissing = await keyNotConfigured.count();
    await expect(page.getByText('معرّف هذا التثبيت')).toBeVisible();
    await expect(page.getByText('النسخة المجانية مفعّلة.')).toBeVisible();

    if (keyMissing) {
      await expect(keyNotConfigured).toBeVisible();
      await expect(page.getByRole('button', { name: /نسخ طلب التفعيل/ })).toHaveCount(0);
    } else {
      await expect(page.getByText('طلب تفعيل Pro')).toBeVisible();
      await expect(page.getByRole('button', { name: /شهر واحد/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /ثلاثة أشهر/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /سنة كاملة/ })).toBeVisible();
    }

    expect(apiRequests).toEqual([]);
  });
});
