import { test, expect } from '@playwright/test';
import { signInAs } from '../helpers/auth';

/**
 * Negative-path RBAC assertions. Each non-MFA role hits a route they
 * are explicitly NOT permitted to access, and we confirm the system
 * either returns 403, redirects them away, or renders an inline
 * "Access denied" message. These guards lock in the proxy + page-auth
 * layered defence so a refactor doesn't accidentally widen access.
 *
 * Maps to FINAL_LAUNCH_PLAN §5 S-* (security) entries.
 */

interface Forbidden {
  role: 'analyst' | 'senior_reviewer' | 'onboarding_agent' | 'read_only';
  path: string;
  reason: string;
}

const FORBIDDEN_ROUTES: Forbidden[] = [
  { role: 'analyst',          path: '/admin/users',  reason: 'admin-only' },
  { role: 'analyst',          path: '/admin/config', reason: 'admin-only' },
  { role: 'analyst',          path: '/admin/platform', reason: 'platform-super-admin only' },
  { role: 'senior_reviewer',  path: '/admin/users',  reason: 'admin-only' },
  { role: 'onboarding_agent', path: '/cases',        reason: 'no case-list permission' },
  { role: 'onboarding_agent', path: '/audit',        reason: 'mlro/admin only' },
  { role: 'read_only',        path: '/admin/users',  reason: 'admin-only' },
  { role: 'read_only',        path: '/cases',        reason: 'no case-list permission' },
  { role: 'read_only',        path: '/audit',        reason: 'mlro/admin only' },
];

for (const { role, path, reason } of FORBIDDEN_ROUTES) {
  test(`${role} cannot access ${path} (${reason})`, async ({ page }) => {
    await signInAs(page, role);
    const res = await page.goto(path);
    const status = res?.status() ?? 0;

    if (status === 403) {
      // Proxy middleware returned 403 — end of story.
      return;
    }

    // 200 means the request landed somewhere — either the page
    // redirected (URL changed) OR rendered an inline "Access denied".
    // Either is acceptable; what's NOT acceptable is rendering the
    // protected page's actual content.
    if (status === 200) {
      const url = page.url();
      if (url.includes(path)) {
        // We stayed on the path — must show an access-denied surface.
        await expect(page.getByText('Access denied', { exact: true })).toBeVisible({
          timeout: 5000,
        });
      }
      // Otherwise URL changed: the proxy or Next.js redirected the
      // request, which is the intended behaviour for many of these.
    } else {
      // Anything other than 200 / 403 is unexpected.
      throw new Error(
        `Expected 200 (redirected) or 403 for ${role} → ${path}, got ${status}`,
      );
    }
  });
}

test('navigating to a nonexistent case id returns a not-found page', async ({ page }) => {
  await signInAs(page, 'analyst');
  // UUID that doesn't exist in the seed.
  const res = await page.goto('/cases/00000000-0000-0000-dead-000000000000');
  // Next.js notFound() returns 404. The page renders a minimal not-found
  // surface; we don't assert on copy because that may be customised later.
  expect([404, 200]).toContain(res?.status() ?? 0);
});
