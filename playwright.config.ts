import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AML/KYC/CDD Portal end-to-end tests.
 *
 * Layered approach:
 *   - `marketing` project   → public pages, no auth required, runs against a
 *                              built+started Next.js server.
 *   - `app` project          → authenticated platform tests. Requires a seeded
 *                              tenant + test users with predictable IDs.
 *                              Skipped in CI until seed lands; see
 *                              tests/e2e/README.md.
 *
 * Use `E2E_BASE_URL` to point the suite at a Vercel preview deployment for
 * smoke-on-preview runs.
 */

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in parallel locally; serial in CI to keep logs readable. */
  fullyParallel: !isCI,
  /* Don't allow .only() in CI — it would silently shrink the suite. */
  forbidOnly: isCI,
  /* Retry once in CI to absorb flaky network. Local devs see flakes raw. */
  retries: isCI ? 1 : 0,
  /* Single worker in CI keeps resource usage predictable on the runner. */
  workers: isCI ? 1 : undefined,
  /* Reporters: list for humans, GitHub annotations on PRs, junit for CI store. */
  reporter: isCI
    ? [['list'], ['github'], ['junit', { outputFile: 'tests/e2e-results/junit.xml' }]]
    : [['list']],
  /* Outputs (screenshots, traces) — gitignored. */
  outputDir: 'tests/e2e-results/output',

  use: {
    baseURL,
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    /* No automatic ignore of HTTPS errors — surface them. */
    ignoreHTTPSErrors: false,
  },

  projects: [
    {
      name: 'marketing',
      testDir: './tests/e2e/marketing',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'app',
      testDir: './tests/e2e/app',
      use: { ...devices['Desktop Chrome'] },
      /* Authenticated tests require a seeded test tenant. Skipped by default
       * until the seed lands. Set E2E_RUN_APP=1 to opt in. */
      grep: process.env.E2E_RUN_APP ? undefined : /__never_match__/,
    },
  ],

  /* When E2E_BASE_URL is unset, Playwright starts a Next.js prod server. We
   * use `npm run start` against a pre-built `.next/`. The build itself is
   * the responsibility of the caller (CI does it as a separate step). */
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
