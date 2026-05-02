import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';
import { TEST_CASES, TEST_CUSTOMERS } from '../helpers/seed-config';

/**
 * Authenticated case-workflow smoke. Exercises the seeded fixtures from
 * supabase/seed.sql §5: medium-risk customer assigned to the analyst,
 * high-risk customer assigned to the senior reviewer.
 *
 * Maps to FINAL_LAUNCH_PLAN.md §5: R-13 (analyst opens assigned case),
 * R-11 (SR sees their queue), and the read-only / onboarding-agent
 * positive-path checks.
 */

test.describe('Analyst — assigned case visible', () => {
  test('analyst sees their assigned case in /cases', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto('/cases');

    // The seeded analyst case is in_review, queue=standard. Match on the
    // customer name fragment so the test isn't tied to a particular column
    // ordering — the page renders the customer name in the row.
    await expect(
      page.getByText(new RegExp(TEST_CUSTOMERS.medium_risk.full_name.split(' ')[0] ?? 'Aisha', 'i')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('analyst can open their assigned case detail', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // The case detail page renders a top-level heading or the breadcrumb
    // with the case ID prefix. Either is acceptable.
    await expect(page.getByText(TEST_CASES.analyst_case.id.slice(0, 8), { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    // EDD section is gated by customers:read_edd_data — analyst should NOT
    // see it. This is the inverse assertion that guards tipping-off /
    // EDD-visibility regressions.
    await expect(page.getByRole('heading', { name: /enhanced due diligence/i })).toHaveCount(0);
  });
});

test.describe('Senior Reviewer — EDD-queue case visible with EDD section', () => {
  test('SR sees their EDD case in the queue', async ({ page }) => {
    await signInAs(page, 'senior_reviewer');
    await page.goto('/cases');
    await expect(
      page.getByText(new RegExp(TEST_CUSTOMERS.high_risk.full_name.split(' ')[0] ?? 'Hamad', 'i')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('SR can see the EDD section on a high-risk case', async ({ page }) => {
    await signInAs(page, 'senior_reviewer');
    await page.goto(`/cases/${TEST_CASES.sr_case.id}`);
    // SR has customers:read_edd_data — the EDD panel must render even
    // when no record has been captured yet.
    await expect(
      page.getByRole('heading', { name: /enhanced due diligence/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Read-only — aggregate reporting only', () => {
  test('read-only lands on /reporting and is blocked from /cases', async ({ page }) => {
    await signInAs(page, 'read_only');

    // Reporting is the right home for this role.
    await page.goto('/reporting');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });

    // /cases is not in the read-only navigation; the proxy or page-level
    // RBAC may either 403 or redirect. We don't pin the exact behaviour;
    // we just confirm the URL doesn't end up showing the cases table.
    const res = await page.goto('/cases');
    if ((res?.status() ?? 0) === 200) {
      const url = page.url();
      if (url.includes('/cases')) {
        await expect(page.getByText('Access denied', { exact: true })).toBeVisible();
      }
    }
  });
});

test.describe('Onboarding agent — landing dashboard renders', () => {
  test('agent dashboard surfaces the New Onboarding entry points', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    await expect(
      page.getByText(/New Individual KYC|New Corporate KYB|New Onboarding/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
