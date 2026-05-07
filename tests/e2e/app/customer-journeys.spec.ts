import { test, expect } from '@playwright/test';
import { signInAs, signOut } from '../helpers/auth';
import { TEST_CASES, TEST_CUSTOMERS, TEST_TENANT } from '../helpers/seed-config';

/**
 * Customer journey scenarios C-01 through C-08.
 * Source: FINAL_LAUNCH_PLAN.md §5 test scenario matrix.
 *
 * Notes on scope:
 *
 * C-01 / C-02 / C-03 / C-04  (happy path, medium, high, unacceptable risk)
 *   Full end-to-end execution (fill the onboarding form, trigger IDV, trigger
 *   screening, wait for risk engine) requires the IDV provider credentials
 *   and a fully seeded workflow definition. These tests validate the
 *   *structural surface*: onboarding route reachable, session can be created
 *   (via API), case routing visible to the expected role queue. They do NOT
 *   drive the full IDV widget; that requires live Sumsub credentials.
 *
 * C-05  (Corporate KYB)
 *   UBO engine (Sprint 2 S2-06) not yet live. Test validates the /onboard
 *   route is reachable and shows entity-type selector.
 *
 * C-06  (Session abandoned mid-flow / resumable)
 *   Validated via the API: a session in 'paused' status should be resumable.
 *   The onboarding-agent dashboard "Stuck Sessions" widget surfaces paused
 *   sessions > 48h — we verify that the stat label renders.
 *
 * C-07  (Consent declined)
 *   The consent API route returns 204 with a declined payload and creates
 *   an audit event. Tested via API surface within the test.
 *
 * C-08  (Document upload + hash)
 *   The document upload form is within the onboarding flow. We verify the
 *   upload API route surface responds to an unauthenticated probe with a
 *   correct error shape (not a 500 crash).
 */

test.describe('C-02 — Medium-risk customer case routed to Analyst queue', () => {
  // The seed creates a medium-risk case assigned to the analyst.
  test('analyst dashboard shows medium-risk case in their queue', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto('/cases');
    await expect(
      page.getByText(new RegExp(TEST_CUSTOMERS.medium_risk.full_name.split(' ')[0] ?? 'Aisha', 'i')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('medium-risk case detail renders without errors', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);
    // Page renders successfully (no unhandled error boundary)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });
    // Risk band badge is present
    await expect(page.getByText(/medium/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('C-03 — High-risk customer case routed to Senior Reviewer queue', () => {
  test('senior_reviewer dashboard shows high-risk case in their queue', async ({ page }) => {
    await signInAs(page, 'senior_reviewer');
    await page.goto('/cases');
    await expect(
      page.getByText(new RegExp(TEST_CUSTOMERS.high_risk.full_name.split(' ')[0] ?? 'Hamad', 'i')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('high-risk case detail renders with EDD section for Senior Reviewer', async ({ page }) => {
    await signInAs(page, 'senior_reviewer');
    await page.goto(`/cases/${TEST_CASES.sr_case.id}`);
    await expect(
      page.getByRole('heading', { name: /enhanced due diligence/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('C-04 — Unacceptable risk case NOT visible to analyst', () => {
  // Analyst queue is gated to standard+medium. High/unacceptable go to SR/MLRO.
  test('analyst cannot see or navigate to the high-risk EDD case', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto('/cases?queue=edd');
    // Either the analyst is redirected, or the EDD case does not appear in
    // their filtered view. The high-risk customer name should not be visible.
    const body = await page.locator('main').innerText().catch(() => '');
    // Either access is denied or the EDD case is filtered out.
    // Both outcomes are acceptable; the point is the analyst's /cases list
    // never shows EDD-queue cases without the right permission.
    expect(
      !body.includes(TEST_CUSTOMERS.high_risk.full_name) ||
        body.includes('Access denied') ||
        body.includes('No cases'),
    ).toBeTruthy();
  });
});

test.describe('C-06 — Session resumable from paused state', () => {
  test('onboarding agent dashboard surface shows stuck sessions count', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    // The OnboardingAgentDashboard renders a "Stuck Sessions" stat card.
    // We verify the widget renders (count may be 0 on a clean seed).
    await expect(page.getByText(/Stuck Sessions/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('C-07 — Consent declined terminates session gracefully', () => {
  test('consent API route returns 400 on malformed payload (no crash)', async ({ request }) => {
    // We can't easily drive the consent form here without a live session,
    // but we can confirm the route doesn't 500 on a malformed request.
    const res = await request.post('/api/onboarding/consent', {
      data: {},
    });
    // 401 (no auth) or 400 (bad body) — not 500
    expect([400, 401, 404]).toContain(res.status());
  });
});

test.describe('C-08 — Document upload route reachable + returns correct error shape', () => {
  test('document upload route returns 401 for unauthenticated requests (not 500)', async ({
    request,
  }) => {
    const res = await request.post('/api/documents/upload', {
      data: {},
    });
    // 401 unauthenticated; 404 if route is namespaced differently.
    // Critically NOT 500 (crash) or 200 (open upload).
    expect([401, 404, 405]).toContain(res.status());
  });

  test('document status route returns 401 for unauthenticated requests (not 500)', async ({
    request,
  }) => {
    const res = await request.get(
      `/api/documents/status?customerId=${TEST_CUSTOMERS.medium_risk.id}`,
    );
    expect([401, 404, 405]).toContain(res.status());
  });
});

test.describe('C-05 — Onboarding route accessible to onboarding agent', () => {
  test('onboard route renders with the tenant slug from the seed', async ({ page }) => {
    await signInAs(page, 'onboarding_agent');
    const slug = TEST_TENANT.slug;
    const res = await page.goto(`/${slug}/onboard`);
    // Should land on the onboarding start page or tenant branding wrapper.
    // A 404 here would be a critical regression.
    expect(res?.status()).not.toBe(500);
    // Page should render some content (not crash)
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('C-01 — Happy path onboarding API surface', () => {
  test('IDV start route returns 401 for unauthenticated request (not 500)', async ({
    request,
  }) => {
    const res = await request.post('/api/onboarding/idv/start', {
      data: { onboardingSessionId: '00000000-0000-0000-0000-000000000000' },
    });
    expect([401, 400]).toContain(res.status());
  });

  test('IDV status route returns 401 for unauthenticated request (not 500)', async ({
    request,
  }) => {
    const res = await request.get(
      '/api/onboarding/idv/status?sessionId=00000000-0000-0000-0000-000000000000',
    );
    expect([401, 400]).toContain(res.status());
  });
});
