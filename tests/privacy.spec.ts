import { test, expect } from '@playwright/test';

test('Privacy verification - zero data leaves the browser', async ({ page }) => {
  const interceptedRequests: Array<{ url: string; postData: string | null }> = [];
  const interceptedWebSocketFrames: string[] = [];

  // Intercept all requests (capturing full URLs)
  page.on('request', (request) => {
    interceptedRequests.push({
      url: request.url(),
      postData: request.postData(),
    });
  });

  // Intercept all WebSocket frames
  page.on('websocket', (ws) => {
    ws.on('framesent', (event) => {
      const payload = typeof event.payload === 'string' ? event.payload : event.payload.toString();
      interceptedWebSocketFrames.push(payload);
    });
    ws.on('framereceived', (event) => {
      const payload = typeof event.payload === 'string' ? event.payload : event.payload.toString();
      interceptedWebSocketFrames.push(payload);
    });
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

  // Select some heirs and add custom names, including an impeded heir
  const nameInputs = page.locator('input[placeholder*="الاسم"]');
  const count = await nameInputs.count();
  const sensitiveHeirNames = [
    'فاطمة الزهراء البشير',
    'أحمد كمال الوريث',
    'خالد الممنوع القاتل' // Impeded heir sensitive-data fixture
  ];
  
  for (let i = 0; i < Math.min(count, sensitiveHeirNames.length); i++) {
    const input = nameInputs.nth(i);
    await input.focus();
    await input.fill(sensitiveHeirNames[i]);
  }

  // Perform some user actions to trigger state updates / rendering
  await page.click('text=بيانات المتوفى والتركة'); // collapse/expand panel
  await page.waitForTimeout(1000); // Wait for potential network events

  // Assert that none of the intercepted request bodies or WebSocket frames contain the sensitive data
  const sensitiveDataList = [
    sensitiveEstate,
    sensitiveDeceasedName,
    ...sensitiveHeirNames
  ];

  // Check HTTP post data
  for (const req of interceptedRequests) {
    if (!req.postData) continue;
    for (const sensitiveString of sensitiveDataList) {
      expect(req.postData).not.toContain(sensitiveString);
    }
  }

  // Check WebSocket frames
  for (const frame of interceptedWebSocketFrames) {
    for (const sensitiveString of sensitiveDataList) {
      expect(frame).not.toContain(sensitiveString);
    }
  }

  // Allowlist-based assertions for same-origin requests
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://lattab.vercel.app',
    'https://mawarith.dz'
  ];

  for (const req of interceptedRequests) {
    // Skip standard internal protocols and chrome extension assets
    if (req.url.startsWith('chrome-extension://') || req.url.startsWith('data:') || req.url.startsWith('blob:')) {
      continue;
    }
    const isAllowed = allowedOrigins.some(origin => req.url.startsWith(origin));
    expect(isAllowed).toBe(true);
  }
});
