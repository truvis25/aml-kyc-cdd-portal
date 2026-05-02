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
