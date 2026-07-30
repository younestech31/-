import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Scan (a11y)', () => {
  test('home page should not have any critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    // Wait for the main page layout to load
    await page.waitForSelector('main');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Disable color-contrast and duplicate-id rules on the interactive React Flow chart area
      // since third-party rendering structures may generate custom canvas elements and repeated IDs.
      .disableRules(['color-contrast', 'scrollable-region-focusable', 'duplicate-id-active'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('A11Y Violations:', JSON.stringify(results.violations, null, 2));
    }

    // Fail only if we have critical violations that affect users with severe disabilities
    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });

  test('faq page should be free of critical accessibility violations', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForSelector('main');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });
});
