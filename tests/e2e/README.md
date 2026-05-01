# End-to-End Tests (Playwright)

Source: `FINAL_LAUNCH_PLAN.md` §5 (test-scenario matrix), §9 Sprint 1 item 1.6.

## Layout

```
tests/e2e/
├── marketing/   ← public pages, no auth, no DB. Always runs in CI.
├── app/         ← authenticated platform tests. Opt-in via E2E_RUN_APP=1.
└── helpers/     ← shared utilities (auth, fixtures).
```

Two Playwright `projects` are defined in `playwright.config.ts`:

| Project    | What it tests                                                       | Runs in CI? |
| ---------- | ------------------------------------------------------------------- | ----------- |
| `marketing` | landing, /compare, /pricing, /security, /book-demo, /signup, legal | ✅ on every PR |
| `app`      | auth, role routing, cases, customers, SAR, audit                    | ⛔ until seed lands |

The `app` project is gated by `E2E_RUN_APP=1` because it needs:
1. A seeded test tenant in Supabase (test schema or dedicated project).
2. One test user per role with `E2E_<ROLE>_EMAIL` and `E2E_<ROLE>_PASSWORD` env vars.
3. MFA pre-completed for `tenant_admin` and `mlro` roles in the seed.

Until the seed job lands, `app` tests are silently skipped (`grep: /__never_match__/`).

## Run locally

### Marketing project (public, no setup required)

```bash
# One-time: install Playwright browser binaries
npx playwright install chromium

# Build then run (Playwright spawns `npm run start` for you)
npm run build
npm run test:e2e:marketing

# Or with the Playwright UI
npm run test:e2e:ui -- --project=marketing
```

### App project (authenticated, requires seed)

```bash
# Required env (export before running)
export E2E_TENANT_ADMIN_EMAIL='admin@test.local'
export E2E_TENANT_ADMIN_PASSWORD='…'
export E2E_MLRO_EMAIL='mlro@test.local'
# … and the rest

npm run build
npm run test:e2e:app
```

### Run against a Vercel preview deployment

```bash
E2E_BASE_URL=https://aml-kyc-cdd-portal-git-claude-…vercel.app \
  npm run test:e2e:marketing
```

When `E2E_BASE_URL` is set, Playwright skips spawning a local server.

## What's covered today

### `marketing/landing.spec.ts`
- Landing renders with the new generic comparison cards
- Both compare cards link to `/compare`
- Customer-facing copy contains zero competitor names (regression guard for the brief)
- Primary nav routes (`/product`, `/pricing`, `/security`, `/compare`, `/book-demo`, `/signup`) all render

### `marketing/compare.spec.ts`
- `/compare` index renders both comparison categories
- No competitor names appear
- Old `/compare/sumsub` and `/compare/azakaw` URLs 301-redirect to `/compare`

### `marketing/legal.spec.ts`
- All four legal pages render
- Sub-processors page lists the IDV vendor (the *one* permitted disclosure under PDPL/GDPR)

### `marketing/security-headers.spec.ts`
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- `x-powered-by` is **not** present (`poweredByHeader: false` honoured)

### `app/sign-in.spec.ts` (gated)
- Unauthenticated `/dashboard` → `/sign-in`
- Analyst lands on the analyst dashboard
- Analyst is RBAC-blocked from `/audit`

### `app/role-routing.spec.ts` (gated)
- All 6 in-tenant roles land on the correct role-specific dashboard fingerprint

## What's NOT covered yet

The full FINAL_LAUNCH_PLAN.md §5 matrix has 57 named scenarios. This PR ships
the harness + ~15 of them. The remaining ~42 (customer journeys C-01 through
C-16, role workflows R-13 through R-21, security S-01 through S-13, performance
P-01 through P-05) require the seed and per-feature scaffolding to land in
Sprint 2. Authoring them is fast once the seed is in place — the shape is set.

## Adding a new test

1. Pick the right project: `marketing/` for unauth, `app/` for authenticated.
2. Use `helpers/auth.ts` `signInAs(page, role)` for any authenticated test.
3. Map the test to a scenario ID from FINAL_LAUNCH_PLAN.md §5 in the doc-comment.
4. Keep selectors role/aria-friendly (`getByRole`, `getByText`, `getByLabel`)
   over CSS selectors so refactors don't break tests.
5. Run `npm run test:e2e:marketing` (or `…:app`) locally before pushing.
