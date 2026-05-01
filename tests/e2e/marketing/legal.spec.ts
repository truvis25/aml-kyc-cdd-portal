import { test, expect } from '@playwright/test';

/**
 * Legal pages must be reachable. Sub-processors page is the ONE place the
 * IDV vendor name is permitted (PDPL/GDPR mandated processor disclosure).
 */

test.describe('Legal pages', () => {
  for (const path of ['/legal/terms', '/legal/privacy', '/legal/dpa', '/legal/sub-processors']) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  }

  test('sub-processors page lists the IDV processor (mandated disclosure)', async ({ page }) => {
    await page.goto('/legal/sub-processors');
    // This is the *only* customer-facing surface where this vendor name is
    // permitted, because PDPL + GDPR require explicit processor disclosure.
    await expect(page.getByText(/sumsub/i)).toBeVisible();
  });
});
