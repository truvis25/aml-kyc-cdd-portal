import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';
import { TEST_CASES, TEST_CUSTOMERS } from '../helpers/seed-config';

/**
 * Case detail page render coverage. Read-only assertions over the
 * seeded fixtures — locks in the workbench UX without mutating state.
 *
 * Maps to FINAL_LAUNCH_PLAN §5: R-13 (analyst review path), the
 * negative-assertion tipping-off guards (analyst doesn't see SAR
 * controls), and the Emirates ID surface acceptance.
 */

test.describe('Case detail — analyst view', () => {
  test('analyst sees the customer Emirates ID in canonical 784-…-… form', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // The seed sets emirates_id_number = '784-1990-1234567-6' for the
    // medium-risk customer (Aisha). The customer-identity panel renders
    // the column directly, so the dashed canonical form should appear.
    await expect(page.getByText('784-1990-1234567-6')).toBeVisible({ timeout: 10_000 });
  });

  test('analyst sees the risk band badge for their assigned case', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // medium-risk case: composite score 45.00, band 'medium'. The risk
    // panel renders the band as a label; case for case-insensitivity in
    // case the styling capitalises.
    await expect(page.getByText(/medium/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('analyst does NOT see the SAR flag control (permission gate)', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // SAR flag is gated by cases:flag_sar — only mlro / tenant_admin /
    // platform_super_admin have it. Analyst MUST NOT see this control.
    // Tipping-off-prevention regression guard.
    await expect(page.getByRole('button', { name: /flag.+sar|sar.+flag/i })).toHaveCount(0);
    await expect(page.getByText(/SAR Flagged|Flag for SAR/i)).toHaveCount(0);
  });

  test('analyst does NOT see the EDD section on their medium-risk case', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // EDD panel is gated by customers:read_edd_data — analyst must not
    // see it even when the underlying case has no EDD record.
    await expect(page.getByRole('heading', { name: /enhanced due diligence/i })).toHaveCount(0);
  });

  test('analyst case detail shows the customer name from the seed', async ({ page }) => {
    await signInAs(page, 'analyst');
    await page.goto(`/cases/${TEST_CASES.analyst_case.id}`);

    // First word of "Aisha Test Subject"; the row column renders the
    // full name in customer-identity panel.
    await expect(page.getByText(TEST_CUSTOMERS.medium_risk.full_name)).toBeVisible({
      timeout: 10_000,
    });
  });
});
