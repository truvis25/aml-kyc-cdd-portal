import type { Page } from '@playwright/test';

/**
 * Auth helpers for the `app` Playwright project.
 *
 * Two modes are supported:
 *
 * 1. **Sign-in via UI** (`signInAs`): drives the real sign-in form with a
 *    seeded test user. Slower but exercises the full auth path including
 *    JWT enrichment via the Postgres custom_access_token_hook.
 *
 * 2. **Storage-state bypass** (`useStorageStateForRole`): pre-saved Supabase
 *    session cookies for each test role. ~10x faster but requires the seed
 *    job to have written the storage-state files first.
 *
 * Until the seed lands, both paths require the env vars below to be set.
 * See tests/e2e/README.md for the full setup.
 */

export interface TestUser {
  email: string;
  password: string;
  expectedRole: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  tenant_admin: {
    email: process.env.E2E_TENANT_ADMIN_EMAIL ?? '',
    password: process.env.E2E_TENANT_ADMIN_PASSWORD ?? '',
    expectedRole: 'tenant_admin',
  },
  mlro: {
    email: process.env.E2E_MLRO_EMAIL ?? '',
    password: process.env.E2E_MLRO_PASSWORD ?? '',
    expectedRole: 'mlro',
  },
  senior_reviewer: {
    email: process.env.E2E_SENIOR_REVIEWER_EMAIL ?? '',
    password: process.env.E2E_SENIOR_REVIEWER_PASSWORD ?? '',
    expectedRole: 'senior_reviewer',
  },
  analyst: {
    email: process.env.E2E_ANALYST_EMAIL ?? '',
    password: process.env.E2E_ANALYST_PASSWORD ?? '',
    expectedRole: 'analyst',
  },
  onboarding_agent: {
    email: process.env.E2E_ONBOARDING_AGENT_EMAIL ?? '',
    password: process.env.E2E_ONBOARDING_AGENT_PASSWORD ?? '',
    expectedRole: 'onboarding_agent',
  },
  read_only: {
    email: process.env.E2E_READ_ONLY_EMAIL ?? '',
    password: process.env.E2E_READ_ONLY_PASSWORD ?? '',
    expectedRole: 'read_only',
  },
};

export function requireUser(role: keyof typeof TEST_USERS): TestUser {
  const u = TEST_USERS[role];
  if (!u || !u.email || !u.password) {
    throw new Error(
      `Missing test credentials for role "${role}". Set E2E_${role.toUpperCase()}_EMAIL ` +
        `and E2E_${role.toUpperCase()}_PASSWORD before running app-project tests.`,
    );
  }
  return u;
}

/**
 * Sign in via the real sign-in form. Returns once the post-auth dashboard
 * has rendered. MFA-required roles (tenant_admin, mlro) must have MFA
 * pre-completed in the seed.
 */
export async function signInAs(page: Page, role: keyof typeof TEST_USERS): Promise<void> {
  const user = requireUser(role);
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Land on /dashboard or whichever role-specific landing page the proxy chose.
  await page.waitForURL(/\/dashboard(?:$|\/|\?)/, { timeout: 15_000 });
}
