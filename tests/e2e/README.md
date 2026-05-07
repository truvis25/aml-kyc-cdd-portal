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
1. A seeded test tenant in Supabase (the seed in `supabase/seed.sql` does this for local dev).
2. The four non-MFA test users from the seed (analyst, senior_reviewer,
   onboarding_agent, read_only). Credentials live as constants in
   `tests/e2e/helpers/seed-config.ts` — no env vars needed for these.

**MFA-required roles** (tenant_admin, mlro) are NOT yet covered. The proxy
enforces `aal=aal2` for those roles (`MFA_REQUIRED_ROLES` in `proxy.ts`),
and bypassing it in middleware would be a security backdoor. Enrolling
a TOTP factor at seed time via `auth.mfa_factors` is fragile and
Supabase-version-specific. Deferred to a "seed v2" pass that either
runs against a no-MFA Supabase project or adds an admin script using
`supabase.auth.admin.mfa.*`. Until then, those role tests are absent
from the suite.

When `E2E_RUN_APP` is unset, `app` tests are silently skipped
(`grep: /__never_match__/` in `playwright.config.ts`).

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

The seed credentials live in `tests/e2e/helpers/seed-config.ts` — you do
NOT need to export env vars. The flow is:

```bash
# 1. Reset the local Supabase db so all migrations + seed.sql apply
supabase db reset

# 2. Build the app
npm run build

# 3. Run the app project (E2E_RUN_APP=1 is set by the npm script)
npm run test:e2e:app
```

Seeded test users (local dev only; password `TestPass123!` for all four):

| Role             | Email                          |
| ---------------- | ------------------------------ |
| analyst          | analyst@truvis-test.local       |
| senior_reviewer  | sr@truvis-test.local            |
| onboarding_agent | agent@truvis-test.local         |
| read_only        | readonly@truvis-test.local      |

Plus two seeded customers + two cases (one assigned to analyst, one to
senior_reviewer). Customer / case IDs are exported by `seed-config.ts`
so tests can reference them without hard-coding.

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
- Analyst signs in and lands on the analyst dashboard
- Analyst is RBAC-blocked from `/audit`

### `app/role-routing.spec.ts` (gated)
- The four non-MFA roles (analyst, senior_reviewer, onboarding_agent,
  read_only) each land on the correct role-specific dashboard fingerprint
- tenant_admin / mlro variants are absent until MFA seed lands

### `app/case-workflow.spec.ts` (gated)
- Analyst sees their seeded medium-risk case in `/cases`
- Analyst can open the case detail; EDD section is NOT visible (RBAC)
- Senior Reviewer sees their seeded high-risk EDD case in `/cases`
- Senior Reviewer can see the EDD section on the case detail
- Read-only lands on `/reporting`; `/cases` is blocked or unavailable
- Onboarding agent sees the New Onboarding entry points

### `app/customer-journeys.spec.ts` (gated) — Sprint 1 S1-05
Customer journey scenarios C-01 through C-08:
- C-01: IDV API surface returns correct auth error shapes (not 500)
- C-02: Medium-risk case visible in analyst queue; case detail renders
- C-03: High-risk case visible in senior_reviewer queue; EDD section present
- C-04: Analyst cannot see EDD-queue case (queue filter RBAC)
- C-05: Onboard route reachable with tenant slug
- C-06: Onboarding agent dashboard surfaces "Stuck Sessions" widget
- C-07: Consent API route returns 400/401 on malformed/unauthenticated request
- C-08: Document upload/status routes return 401 for unauthenticated requests

### `app/role-workflows.spec.ts` (gated) — Sprint 1 S1-05
Role workflow scenarios R-01 through R-12:
- R-01 through R-10: `test.skip` stubs targeting MFA roles (tenant_admin, mlro).
  Deferred to seed v2 (Sprint 2). The skip message preserves the tracking link.
- R-11: Senior Reviewer case detail renders; approval surface present; risk band visible
- R-12: Escalation API returns correct auth error; SR does not see SAR controls
- R-07 proxy: SAR route blocked for all 4 non-MLRO seeded roles (tipping-off guard)
- R-10 proxy: Audit log blocked for analyst, onboarding_agent, read_only

### `app/dashboard-polish.spec.ts` (gated) — Sprint 1 S1-03 / S1-04
Dashboard-polish regression guards:
- Analyst: stat card labels render; empty state or quick-actions panel renders
- Senior Reviewer: four stat card labels render
- Onboarding Agent: PeriodToggle renders; clicking "30 days" updates URL + label
- Read-only: four aggregate stat cards; sparkline SVG in DOM; empty state or real data
- Loading: no uncaught JS errors when navigating to /dashboard

## What's NOT covered yet

The full FINAL_LAUNCH_PLAN.md §5 matrix has 57 named scenarios. Sprint 1 ships
≥20 scenarios (C-01→C-08 structural + R-11/R-12 live + R-01→R-10 stubs +
dashboard-polish guards + security/RBAC). The remaining scenarios
(C-09→C-16, R-13→R-21, S-01→S-13, P-01→P-05) require either MFA seed or
Sprint 2 feature work. Authoring them is fast once the seed + features land.

## Adding a new test

1. Pick the right project: `marketing/` for unauth, `app/` for authenticated.
2. Use `helpers/auth.ts` `signInAs(page, role)` for any authenticated test.
3. Map the test to a scenario ID from FINAL_LAUNCH_PLAN.md §5 in the doc-comment.
4. Keep selectors role/aria-friendly (`getByRole`, `getByText`, `getByLabel`)
   over CSS selectors so refactors don't break tests.
5. Run `npm run test:e2e:marketing` (or `…:app`) locally before pushing.
