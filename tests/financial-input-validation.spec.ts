import { test, expect } from '@playwright/test';

test('invalid financial inputs show a blocking review alert and disable copying results', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('mirath_guide_seen', 'true');
  });

  await page.goto('/');

  const monetaryInputs = page.locator('input[type="number"]');
  await expect(monetaryInputs).toHaveCount(4);

  // Gross estate and debt are the first two root-stage monetary inputs.
  await monetaryInputs.nth(0).fill('1000');
  await monetaryInputs.nth(1).fill('-1');

  await expect(
    page.getByRole('alert').filter({ hasText: 'توقّف الحساب بسبب مدخلات مالية غير صالحة' })
  ).toBeVisible();
  await expect(
    page.getByText('قيمة «الديون» لا يمكن أن تكون سالبة.')
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: /نسخ النص/ })
  ).toBeDisabled();
});
