import { test, expect } from '@playwright/test';

test.describe('Legacy Arabic informational routes', () => {
  test('wife inheritance page remains reachable at its public Arabic URL', async ({ page }) => {
    const response = await page.goto('/ميراث-الزوجة');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'أحكام ميراث الزوجة في قانون الأسرة الجزائري' })
    ).toBeVisible();
  });

  test('mandatory bequest page remains reachable at its public Arabic URL', async ({ page }) => {
    const response = await page.goto('/الوصية-الواجبة');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'أحكام الوصية الواجبة في القانون الجزائري' })
    ).toBeVisible();
  });
});
