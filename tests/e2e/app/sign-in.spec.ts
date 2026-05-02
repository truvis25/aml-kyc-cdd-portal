import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Sign-in + RBAC smoke. Maps to FINAL_LAUNCH_PLAN.md §5 R-13 (analyst
 * verify document — at least the navigation half), R-17 (analyst try
 * to approve high-risk — RBAC blocks), and the negative path for an
 * unauthenticated /dashboard hit.
 *
 * Exercises only non-MFA roles per seed-config.ts. tenant_admin and
 * mlro tests are deferred until the MFA seed lands.
 */

test('unauthenticated /dashboard redirects to /sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL(/\/sign-in(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});

test('analyst signs in and lands on the analyst dashboard', async ({ page }) => {
  await signInAs(page, 'analyst');
  // Analyst dashboard fingerprint — DashboardShell title contains
  // "Analyst" or one of the role-specific stat labels.
  await expect(
    page.getByText(/My Cases|Documents to Verify|Screening Hits/i).first(),
  ).toBeVisible({ timeout: 10_000 });
});

test('analyst is RBAC-blocked from /audit', async ({ page }) => {
  await signInAs(page, 'analyst');
  const res = await page.goto('/audit');
  // Acceptable outcomes:
  //   - 403 Forbidden (proxy.ts MLRO_PATHS gate)
  //   - 200 with the "Access denied" inline message
  //   - 200 with a redirect away from /audit
  expect([200, 403]).toContain(res?.status() ?? 0);
  if ((res?.status() ?? 0) === 200) {
    // We didn't crash, but we shouldn't be on /audit any more.
    const url = page.url();
    if (url.includes('/audit')) {
      await expect(page.getByText(/access denied|forbidden|permission/i)).toBeVisible();
    }
  }
});
