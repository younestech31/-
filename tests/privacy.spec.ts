import { test, expect } from '@playwright/test';

test('Privacy verification - zero data leaves the browser', async ({ page }) => {
  const interceptedRequests: Array<{ url: string; postData: string | null }> = [];

  // Intercept all requests
  page.on('request', (request) => {
    const method = request.method();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      interceptedRequests.push({
        url: request.url(),
        postData: request.postData(),
      });
    }
  });

  // Load the calculator page
  await page.goto('/');

  // Enter a sensitive estate amount
  const sensitiveEstate = '7500321';
  const estateInput = page.locator('input[type="number"]').first();
  await estateInput.focus();
  await estateInput.fill(sensitiveEstate);

  // Enter a sensitive deceased name
  const sensitiveDeceasedName = 'المرحوم بن تركي';
  const deceasedNameInput = page.locator('input[placeholder*="اسم المتوفى"]').first();
  await deceasedNameInput.focus();
  await deceasedNameInput.fill(sensitiveDeceasedName);

  // Pick gender (ذكر / male)
  await page.click('text=ذكر');

  // Wait for React Flow nodes to render
  await page.waitForTimeout(500);

  // Select some heirs and add custom names
  // Find name inputs inside React Flow nodes and fill them
  const nameInputs = page.locator('input[placeholder*="الاسم"]');
  const count = await nameInputs.count();
  const sensitiveHeirNames = ['فاطمة الزهراء البشير', 'أحمد كمال الوريث'];
  
  for (let i = 0; i < Math.min(count, sensitiveHeirNames.length); i++) {
    const input = nameInputs.nth(i);
    await input.focus();
    await input.fill(sensitiveHeirNames[i]);
  }

  // Perform some user actions to trigger state updates / rendering
  await page.click('text=بيانات المتوفى والتركة'); // collapse/expand panel
  await page.waitForTimeout(1000); // Wait for potential network events

  // Assert that none of the intercepted request bodies contain the sensitive data
  const sensitiveDataList = [
    sensitiveEstate,
    sensitiveDeceasedName,
    ...sensitiveHeirNames
  ];

  for (const req of interceptedRequests) {
    if (!req.postData) continue;
    for (const sensitiveString of sensitiveDataList) {
      expect(req.postData).not.toContain(sensitiveString);
    }
  }
});
