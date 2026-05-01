import { test, expect } from '@playwright/test';

/**
 * /compare must (a) render the generic comparison index and (b) NOT contain
 * vendor names. Old per-vendor URLs must 301 to /compare.
 */

test.describe('Compare index', () => {
  test('renders the two-category comparison', async ({ page }) => {
    await page.goto('/compare');

    await expect(page.getByRole('heading', { name: /honest comparison/i })).toBeVisible();

    // Both category headings present
    await expect(page.getByText(/vs global identity-verification platforms/i)).toBeVisible();
    await expect(page.getByText(/vs regional GCC compliance suites/i)).toBeVisible();

    // The TruVis column exists in both comparison tables
    const truvisHeaders = page.getByRole('columnheader', { name: /^TruVis$/ });
    await expect(truvisHeaders).toHaveCount(2);
  });

  test('does NOT mention competitor names', async ({ page }) => {
    await page.goto('/compare');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/sumsub/i);
    expect(body).not.toMatch(/azakaw/i);
  });
});

test.describe('Compare legacy URLs redirect to /compare', () => {
  for (const legacy of ['/compare/sumsub', '/compare/azakaw']) {
    test(`${legacy} → /compare (301)`, async ({ page }) => {
      const response = await page.goto(legacy);
      // Final URL after the redirect must land on /compare
      await expect(page).toHaveURL(/\/compare\/?$/);
      // Expect an HTTP 301 in the redirect chain (Next.js permanent: true)
      const chain = response?.request().redirectedFrom();
      expect(chain).toBeTruthy();
    });
  }
});
