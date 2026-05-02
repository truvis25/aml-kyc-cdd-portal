import { test, expect } from '@playwright/test';
import { signInAs, type SeededRole } from '../helpers/auth';

/**
 * Verifies the dashboard router (app/(platform)/dashboard/page.tsx)
 * dispatches to the correct role-specific dashboard. Maps to
 * FINAL_LAUNCH_PLAN.md §5 R-09 / R-11 / R-13 / R-18 / R-20.
 *
 * Only the four seeded non-MFA roles are exercised. tenant_admin and
 * mlro variants are deferred until MFA-aware seed lands.
 */

const DASHBOARD_FINGERPRINT: Record<SeededRole, RegExp> = {
  senior_reviewer: /Awaiting My Decision|Escalated to Me|Recently Closed/i,
  analyst: /My Cases|Documents to Verify|Screening Hits/i,
  onboarding_agent: /Active Sessions|New Onboarding|Stuck Sessions/i,
  read_only: /Monthly Onboarding Volume|Approval Rate|Risk Band Distribution/i,
};

for (const [role, fingerprint] of Object.entries(DASHBOARD_FINGERPRINT) as Array<
  [SeededRole, RegExp]
>) {
  test(`${role} lands on the correct role-specific dashboard`, async ({ page }) => {
    await signInAs(page, role);
    await expect(page.getByText(fingerprint).first()).toBeVisible({ timeout: 10_000 });
  });
}
