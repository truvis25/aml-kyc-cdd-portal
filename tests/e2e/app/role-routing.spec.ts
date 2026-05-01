import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Verifies the dashboard router (app/(platform)/dashboard/page.tsx) dispatches
 * to the correct role-specific dashboard. Maps to FINAL_LAUNCH_PLAN.md
 * scenarios R-09 (MLRO), R-11 (SR), R-13/R-14 (analyst), R-18 (onboarding
 * agent), R-20 (read-only).
 */

const DASHBOARD_FINGERPRINT: Record<string, RegExp> = {
  tenant_admin: /Tenant Operations|Setup completeness|Onboarding volume/i,
  mlro: /MLRO Compliance Oversight|High-Risk Open|SAR Flagged/i,
  senior_reviewer: /Awaiting My Decision|Escalated to Me|Recently Closed/i,
  analyst: /My Cases|Documents to Verify|Screening Hits/i,
  onboarding_agent: /Active Sessions|New Onboarding|Stuck Sessions/i,
  read_only: /Monthly Onboarding Volume|Approval Rate|Risk Band Distribution/i,
};

for (const [role, fingerprint] of Object.entries(DASHBOARD_FINGERPRINT)) {
  test(`${role} lands on the correct role-specific dashboard`, async ({ page }) => {
    await signInAs(page, role as keyof typeof DASHBOARD_FINGERPRINT);
    await expect(page.getByText(fingerprint).first()).toBeVisible({ timeout: 10_000 });
  });
}
