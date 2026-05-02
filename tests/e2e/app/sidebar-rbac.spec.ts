import { test, expect, type Page } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Sidebar visibility per role. The `Sidebar` component (components/
 * shared/sidebar.tsx) hides nav items based on the role; this is one
 * of the user-visible RBAC surfaces and worth pinning so a refactor
 * doesn't accidentally show "Audit Trail" to an analyst.
 *
 * Maps to FINAL_LAUNCH_PLAN §5 R-* entries — these are the read-side
 * RBAC checks complementing the negative-path tests in security.spec.ts.
 */

async function navLinks(page: Page): Promise<string[]> {
  // Sidebar is rendered as a <nav> with anchor children. We grab every
  // link's accessible name; that's the source-of-truth for what the
  // user can navigate to from the chrome.
  const labels = await page.locator('aside nav a').allInnerTexts();
  return labels.map((l) => l.trim()).filter((l) => l.length > 0);
}

test.describe('Analyst sidebar', () => {
  test('shows Dashboard / Cases / Customers; hides Admin, Audit, SAR, Reporting', async ({
    page,
  }) => {
    await signInAs(page, 'analyst');
    const labels = await navLinks(page);

    // Allow-list — should be present
    expect(labels).toEqual(expect.arrayContaining(['Dashboard', 'Cases', 'Customers']));

    // Deny-list — must NOT be present (RBAC + tipping-off)
    expect(labels).not.toContain('SAR Register');
    expect(labels).not.toContain('Audit Trail');
    expect(labels).not.toContain('Users');
    expect(labels).not.toContain('Configuration');
    expect(labels).not.toContain('Workflows');
    expect(labels).not.toContain('Platform Admin');
  });
});

test.describe('Senior Reviewer sidebar', () => {
  test('shows Dashboard / Cases / Customers / Reporting; hides admin + SAR + audit', async ({
    page,
  }) => {
    await signInAs(page, 'senior_reviewer');
    const labels = await navLinks(page);

    expect(labels).toEqual(
      expect.arrayContaining(['Dashboard', 'Cases', 'Customers', 'Reporting']),
    );

    // SR is intentionally blind to SAR per tipping-off (PRD §7).
    expect(labels).not.toContain('SAR Register');
    expect(labels).not.toContain('Audit Trail');
    expect(labels).not.toContain('Users');
    expect(labels).not.toContain('Configuration');
    expect(labels).not.toContain('Platform Admin');
  });
});

test.describe('Onboarding Agent sidebar', () => {
  test('shows Dashboard only of the workbench items; hides Cases / Customers / SAR / Audit', async ({
    page,
  }) => {
    await signInAs(page, 'onboarding_agent');
    const labels = await navLinks(page);

    expect(labels).toContain('Dashboard');
    // Onboarding agent does NOT review cases.
    expect(labels).not.toContain('Cases');
    expect(labels).not.toContain('Customers');
    expect(labels).not.toContain('SAR Register');
    expect(labels).not.toContain('Audit Trail');
    expect(labels).not.toContain('Reporting');
    expect(labels).not.toContain('Users');
  });
});

test.describe('Read-only sidebar', () => {
  test('shows Dashboard + Reporting; hides every operational route', async ({ page }) => {
    await signInAs(page, 'read_only');
    const labels = await navLinks(page);

    expect(labels).toEqual(expect.arrayContaining(['Dashboard', 'Reporting']));

    // Every PII surface must be hidden from the read-only role.
    expect(labels).not.toContain('Cases');
    expect(labels).not.toContain('Customers');
    expect(labels).not.toContain('SAR Register');
    expect(labels).not.toContain('Audit Trail');
    expect(labels).not.toContain('Users');
    expect(labels).not.toContain('Configuration');
    expect(labels).not.toContain('Workflows');
  });
});
