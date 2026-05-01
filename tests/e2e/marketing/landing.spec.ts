import { test, expect } from '@playwright/test';

/**
 * Landing page smoke + the regression that binds us to the brief:
 * no competitor names appear in customer-facing marketing copy.
 */

test.describe('Landing page', () => {
  test('renders the hero and key sections', async ({ page }) => {
    await page.goto('/');

    // Brand mark + "TruVis" in the navigation/hero
    await expect(page.locator('text=TruVis').first()).toBeVisible();

    // Hero pressure-points / CTAs land
    await expect(page.getByRole('heading', { name: /MLRO|workbench|onboarding/i }).first()).toBeVisible();

    // Comparison teaser uses the new generic categories, not vendor names
    await expect(page.getByText(/global IDV platform/i)).toBeVisible();
    await expect(page.getByText(/regional compliance suite/i)).toBeVisible();

    // Both compare cards link to the generic /compare index
    const compareLinks = page.locator('a[href="/compare"]');
    await expect(compareLinks).toHaveCount(2);
  });

  test('does NOT mention competitor names in customer-facing copy', async ({ page }) => {
    await page.goto('/');
    const body = await page.locator('body').innerText();

    // Brief: do not use these names anywhere in our content.
    expect(body).not.toMatch(/sumsub/i);
    expect(body).not.toMatch(/azakaw/i);
  });
});

test.describe('Landing → primary navigation', () => {
  for (const path of ['/product', '/pricing', '/security', '/compare', '/book-demo', '/signup']) {
    test(`navigates to ${path}`, async ({ page }) => {
      await page.goto('/');
      // Some links may live in nav, footer, hero CTAs; we just verify the route loads.
      await page.goto(path);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  }
});
