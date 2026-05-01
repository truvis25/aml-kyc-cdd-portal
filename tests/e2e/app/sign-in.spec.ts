import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Auth project — exercised via E2E_RUN_APP=1 with seeded test users.
 * Maps to FINAL_LAUNCH_PLAN.md scenarios R-01 through R-12.
 */

test.describe('Sign-in flow', () => {
  test('unauthenticated user is sent to /sign-in when visiting /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/sign-in(?:\?|$)/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('analyst lands on the analyst dashboard after sign-in', async ({ page }) => {
    await signInAs(page, 'analyst');
    // Dashboard router (app/(platform)/dashboard/page.tsx) dispatches by role.
    await expect(page.getByText(/My Cases|Documents to Verify|Screening Hits/i).first()).toBeVisible();
  });

  test('analyst is BLOCKED from the audit log (RBAC at middleware)', async ({ page }) => {
    await signInAs(page, 'analyst');
    const res = await page.goto('/audit');
    // Either a 403 page or a redirect to /dashboard — both acceptable.
    expect([403, 200]).toContain(res?.status() ?? 0);
    if ((res?.status() ?? 0) === 200) {
      await expect(page).not.toHaveURL(/\/audit$/);
    }
  });
});
