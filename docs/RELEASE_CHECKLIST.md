# Release Checklist — AML/KYC/CDD Portal

> Pre-deploy gate for all production releases.  
> Every checkbox must be ticked before merging to `main`.  
> Classification: Internal · TruVis International Services

---

## 1. Pre-Deploy (Local / CI)

Run `npm run check` which executes the full gate:

- [ ] `npx tsc --noEmit` — TypeScript strict mode, zero errors
- [ ] `npm run lint` — ESLint zero warnings/errors
- [ ] `npm test` — Vitest unit tests all pass
- [ ] `npm run check:pii` — No PII in application logs
- [ ] `npm run check:foundations` — All 27 foundation files present

Additional manual checks:

- [ ] No `console.log` with PII in changed files (grep: `console.log.*name|email|dob|id_number`)
- [ ] No `TODO` or `FIXME` in `modules/` or `app/api/` (these are compliance surfaces)
- [ ] No `lib/supabase/admin.ts` import in `app/` (CI lint guard should catch this)

---

## 2. Database (if migration is included)

- [ ] Migration file is numbered sequentially (e.g. `0038_...sql`)
- [ ] `supabase db reset` — applies all migrations cleanly on a fresh local DB
- [ ] `supabase test db` — all pgTAP tests pass (including new tests for any new RLS policy)
- [ ] New tables: confirm RLS is `ENABLED` + at least one `SELECT` policy scoped to `tenant_id`
- [ ] Dry-run on staging: `npm run db:push:dry` — reviews migration list before applying
- [ ] Apply to staging and verify with post-migration SQL check (see `docs/DEPLOYMENT.md` §8)
- [ ] If the migration adds an audit trigger: verify `audit_log` row appears after test mutation

---

## 3. Staging Smoke Test

- [ ] Deploy to staging (Vercel preview or staging branch)
- [ ] `npm run test:e2e:marketing` — public marketing pages render correctly
- [ ] `npm run test:e2e:app` — authenticated platform scenarios pass with seeded test users
- [ ] Sign in as each affected role and verify the changed surface works
- [ ] No new JavaScript console errors on changed pages
- [ ] Audit chain intact: `npm run verify:audit-chain` exits 0 on staging DB

---

## 4. Production Deploy

- [ ] PR approved by at least one peer reviewer
- [ ] All CI checks green (GitHub Actions: typecheck, lint, test, build)
- [ ] Merge to `main` — Vercel auto-deploys to production
- [ ] If migration included: apply to production via GitHub Actions Migration workflow (dry-run first)
- [ ] Confirm environment variables are set in Vercel for the deployment environment (see `docs/DEPLOYMENT.md` §3)

---

## 5. Post-Deploy Verification

- [ ] Sign in with a known admin account — lands on `/dashboard`
- [ ] Role badge displays correctly
- [ ] No `session_invalid` redirect loop
- [ ] If MFA-gated route changed: verify MLRO redirect to `/mfa-setup` when MFA not completed
- [ ] `npm run validate:env` passes in the deployment environment
- [ ] Supabase Dashboard → Logs → Auth logs show a clean sign-in
- [ ] Webhook queue: `webhook_events` status distribution looks healthy (see `docs/RUNBOOK.md` §2.3)
- [ ] Audit chain: `npm run verify:audit-chain` exits 0 on production DB

---

## 6. Rollback Plan

Every PR description must include a rollback plan. Template:

```
## Rollback
- App: Vercel → Deployments → "Promote to Production" on previous green deployment (~30s)
- DB: [None required] OR [Migration 003X is additive; rollback migration file: supabase/migrations/003X_rollback_<name>.sql]
```

---

*Release Checklist v1.0 · 2026-05-07 · TruVis International Services*
