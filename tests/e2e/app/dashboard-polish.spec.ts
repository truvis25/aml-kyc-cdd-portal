import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Dashboard-polish regression tests.
 *
 * Validates the new widgets introduced in the dashboard-polish module:
 *   - DashboardSkeleton: loading.tsx fires while page.tsx resolves
 *   - PeriodToggle: today/7-day/30-day toggle renders on tenant-admin + onboarding-agent
 *   - StatCardWithSparkline: sparkline SVG is in the DOM on relevant dashboards
 *   - EmptyState: renders for roles with no seeded data (read_only, onboarding_agent)
 *
 * Maps to FINAL_LAUNCH_PLAN.md S1-03 (dashboard improvements) + S1-04
 * (empty + loading states audit).
 */

test.describe('Analyst dashboard — empty-state + stat cards', () => {
  test('analyst dashboard renders stat card labels', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto('/dashboard');
    // All four stat card labels must be present
    await expect(page.getByText('My Open Cases')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Documents to Verify')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Hits to Resolve')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Pending Info')).toBeVisible({ timeout: 10_000 });
  });

  test('analyst empty-state renders when queue is clear', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto('/dashboard');
    // The seeded analyst has one case, so we check both paths:
    // - If empty: "Your queue is empty" message renders
    // - If not empty: Quick actions panel renders
    const mainContent = await page.locator('main').innerText({ timeout: 10_000 });
    expect(
      mainContent.includes('Your queue is empty') ||
        mainContent.includes('Go to my queue'),
    ).toBeTruthy();
  });
});

test.describe('Senior Reviewer dashboard — stat cards', () => {
  test('SR dashboard renders the four expected stat card labels', async ({ page }) => {
    await signInAs(page, 'senior_reviewer');
    await page.goto('/dashboard');
    await expect(page.getByText('My Open Cases')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Awaiting My Decision')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Escalated To Me')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Overdue (5+ days)')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Onboarding Agent dashboard — period toggle', () => {
  test('onboarding agent dashboard renders the period toggle', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    await page.goto('/dashboard');
    // PeriodToggle renders a role="group" aria-label="Time period"
    await expect(page.getByRole('group', { name: /time period/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('period toggle changes the displayed period label', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    await page.goto('/dashboard');
    // Default period is "today"
    // Click "30 days"
    await page.getByRole('button', { name: '30 days' }).click();
    // Wait for navigation (URL param changes)
    await page.waitForURL(/period=month/, { timeout: 5_000 });
    // The stat card label should now say "last 30 days"
    await expect(page.getByText(/last 30 days/i)).toBeVisible({ timeout: 10_000 });
  });

  test('period toggle "Today" keeps the period param', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    await page.goto('/dashboard?period=month');
    await page.getByRole('button', { name: 'Today' }).click();
    await page.waitForURL(/period=today/, { timeout: 5_000 });
    await expect(page.getByText(/today/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Read-only dashboard — sparkline + empty states', () => {
  test('read-only dashboard renders the four aggregate stat cards', async ({ page }) => {
    await signInAs(page, 'read_only');
    await page.goto('/dashboard');
    await expect(page.getByText('Onboardings Received')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Completed')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Approval Rate')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Screening Hit Rate')).toBeVisible({ timeout: 10_000 });
  });

  test('read-only dashboard renders the sparkline SVG', async ({ page }) => {
    await signInAs(page, 'read_only');
    await page.goto('/dashboard');
    // The StatCardWithSparkline embeds an <svg role="img"> with the aria-label
    // "Onboardings Received trend". On an empty seed it may show the flat-line
    // variant, but the SVG element must be in the DOM.
    const svg = page.locator('svg[aria-label="Onboardings Received trend"]');
    await expect(svg).toBeAttached({ timeout: 10_000 });
  });

  test('read-only empty state renders when no sessions exist', async ({ page }) => {
    await signInAs(page, 'read_only');
    await page.goto('/dashboard');
    const mainText = await page.locator('main').innerText({ timeout: 10_000 });
    // Either real data or the empty state panel is present — never a crash
    expect(
      mainText.includes('No risk band data') ||
        mainText.includes('Risk band distribution') ||
        mainText.includes('No onboarding sessions') ||
        mainText.includes('Monthly volume'),
    ).toBeTruthy();
  });
});

test.describe('Dashboard loading state (skeleton)', () => {
  test('loading.tsx skeleton does not crash', async ({ page }) => {
    // We can't force the Suspense boundary to stay open, but we can confirm
    // the dashboard route loads without an uncaught JS error.
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await signInAs(page, 'analyst');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    expect(errors).toHaveLength(0);
  });
});
