import type { Page } from '@playwright/test';
import { TEST_USERS, type TestUser } from './seed-config';

/**
 * Auth helpers for the `app` Playwright project.
 *
 * Sign-in goes through the real form so we exercise:
 *   - the proxy (auth guard, tenant resolution, MFA enforcement)
 *   - the JWT enrichment hook (custom_access_token_hook)
 *   - the role-aware dashboard router
 *
 * Only non-MFA roles (analyst, senior_reviewer, onboarding_agent,
 * read_only) are seeded by `supabase/seed.sql`. tenant_admin and mlro
 * are blocked by the MFA wall in proxy.ts; we don't have a clean way
 * to enrol a TOTP factor at seed time, so those roles are deferred.
 */

export type SeededRole = keyof typeof TEST_USERS;

export function getSeededUser(role: SeededRole): TestUser {
  return TEST_USERS[role];
}

/**
 * Sign in via the real sign-in form. Returns once the post-auth
 * dashboard has rendered.
 */
export async function signInAs(page: Page, role: SeededRole): Promise<void> {
  const user = getSeededUser(role);

  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Land on /dashboard. waitForURL covers the proxy redirect chain even
  // if Supabase issues a re-fetch on first request.
  await page.waitForURL(/\/dashboard(?:$|\/|\?)/, { timeout: 15_000 });
}

/**
 * Sign out by clearing storage. Faster than driving the UI sign-out
 * button when a test only needs a clean slate before signInAs.
 */
export async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}
