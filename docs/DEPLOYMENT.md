# Deployment Runbook
## AML / KYC / CDD Portal

Stack: Next.js 16 (App Router) · Supabase Postgres + Auth · Vercel (region: me1 Bahrain)

---

## 1. Architecture Overview

```
GitHub (source of truth)
  │
  ├── Feature branches → Vercel Preview deployments (auto)
  ├── main → Vercel Production deployment (auto)
  │
  └── Database migrations → manual workflow trigger only
        (GitHub Actions → Database Migrations → Run workflow)
```

**Deployments are fully automatic** via Vercel's GitHub app integration. Pushing to any branch creates a preview URL. Merging to `main` deploys to production.

**Database migrations are manual** by design. A regulated AML/KYC product cannot have schema changes applied without explicit human review and approval.

---

## 2. Environment Strategy

| Environment | Branch | Vercel | Supabase Project |
|---|---|---|---|
| Local dev | any | `npm run dev` | Local Docker (`supabase start`) |
| Preview | feature branches | Auto preview URL | Staging project |
| Staging | `main` (non-prod) | Vercel staging | Staging project |
| Production | `main` | Vercel production | Production project |

> For Milestone 1/2: staging and production can share a single Supabase project with environment separation via Vercel environment variables. Separate projects should be provisioned before M6 (Production).

---

## 3. Required Secrets and Environment Variables

### GitHub Actions Secrets
Configure at: GitHub repo → Settings → Secrets and variables → Actions

| Secret | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | CI build check | Points to staging project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | CI build check | Staging anon key |
| `NEXT_PUBLIC_APP_URL` | CI build check | Staging app URL |
| `SUPABASE_SERVICE_ROLE_KEY` | CI build check | Staging service role |
| `SUPABASE_ACCESS_TOKEN` | Migration workflow | Supabase personal access token |
| `SUPABASE_DB_PASSWORD` | Migration workflow | Database password |
| `SUPABASE_PROJECT_REF` | Migration workflow | e.g. `zjcxxxwtsbpyphhevlrb` |

For production migrations, create a second set of secrets prefixed `PROD_` and configure a GitHub Environment named `production` with required reviewers.

### Vercel Environment Variables
Configure at: Vercel Project → Settings → Environment Variables

| Variable | Environments | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Project URL from Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Anon/public key — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview | ⚠ Secret — server-only |
| `NEXT_PUBLIC_APP_URL` | All | Set per environment |

---

## 4. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with local Supabase values (from `supabase start` output)

# 3. Start local Supabase (Docker required)
supabase start
# Output will show API URL and anon key — copy to .env.local

# 4. Reset database (runs migrations + seeds in order)
supabase db reset
# Seeds run: 01_roles.sql → 02_test-tenant.sql → 03_admin-user.sql
# Local admin: admin@truvis-test.local / AdminPass123!

# 5. [MANUAL] Register JWT hook in local Supabase Studio
# http://localhost:54323 → Authentication → Hooks
# → Custom Access Token Hook → select: custom_access_token_hook → Save

# 6. Validate environment
npm run validate:env

# 7. Start development server
npm run dev
```

---

## 5. Feature Branch Workflow

```bash
git checkout -b feature/your-feature
# ... make changes ...
npm run check          # typecheck + lint + test
git push origin feature/your-feature
# Vercel auto-creates a preview deployment
# CI runs: lint → typecheck → test → build
# Open PR — template guides checklist
```

---

## 6. Staging Deployment

1. Merge PR to `main`
2. Vercel auto-deploys to production (Vercel's staging environment if configured, else main = production)
3. If the PR contains a migration, apply it separately (see section 8)

---

## 7. Production Deployment

1. All code merged to `main` via reviewed PR
2. Vercel auto-deploys — no manual step for the app
3. Database migrations must be applied separately before or after deployment (see section 8)
4. Post-deploy verification (see section 10)

---

## 8. Database Migration Deployment

**Always run dry-run first. Never skip it.**

### Via GitHub Actions (recommended)

```
GitHub → Actions → Database Migrations → Run workflow
  environment: staging (or production)
  dry_run: true        ← always start here
```

Review the pending migration list output. If it looks correct:

```
  dry_run: false       ← apply for real
```

### Via CLI (fallback)

```bash
# Link to the target project (one-time per machine)
supabase link --project-ref zjcxxxwtsbpyphhevlrb

# Show what will be applied
npm run db:push:dry

# Apply
npm run db:push

# Verify
npm run db:migrate:list
```

### Post-migration SQL verification

Run after applying migrations to confirm schema is correct:

```sql
-- Tables + RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants','roles','users','user_roles','audit_log')
ORDER BY tablename;

-- JWT hook function
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'custom_access_token_hook';

-- Hook GRANT (required for JWT enrichment to work)
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'custom_access_token_hook';

-- Roles seeded
SELECT name FROM roles ORDER BY name;
```

---

## 9. JWT Hook Registration

**[MANUAL STEP — cannot be automated via CLI or migrations]**

After every new Supabase project is provisioned (staging or production):

1. Supabase Dashboard → Authentication → Hooks
2. Custom Access Token Hook → **Enable**
3. Select function: `public.custom_access_token_hook`
4. Save

Without this step, all JWTs will be unenriched. Every login will fail with `session_invalid`.

---

## 10. First-Admin Provisioning (Production Bootstrap)

When a new Supabase project is provisioned and a user has been created via the Auth dashboard:

```sql
-- Run in Supabase SQL Editor or via service role
SELECT provision_admin_user(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- auth.users.id
  'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',  -- tenants.id
  'Admin Name'
);
```

Returns `{ "success": true }` on success. The user can then log in.

---

## 11. Post-Deploy Verification

Run after every production deployment:

- [ ] Sign in with a known admin account — lands on `/dashboard`
- [ ] Dashboard displays role badge correctly
- [ ] No `session_invalid` redirect loop
- [ ] Navigate to `/admin` — redirected to `/mfa-setup` if MFA not completed
- [ ] Navigate to unauthenticated route — redirected to `/sign-in`
- [ ] `npm run validate:env` passes in the deployment environment
- [ ] Supabase Dashboard → Logs → Auth logs show successful sign-in

---

## 12. Rollback

### App rollback (Vercel)
Vercel → Deployments → find last good deployment → Promote to Production. Takes ~30 seconds.

### Database rollback
Supabase migrations are intentionally append-only and non-destructive. Rollback is:
1. Write a new migration that undoes the change
2. Apply it via the migration workflow

No migration should use `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` without explicit review and a paired rollback migration being ready.

---

## 13. Remaining Manual Steps

| Step | When | Why it cannot be automated |
|---|---|---|
| Register JWT hook in Supabase Dashboard | New project provisioning | Supabase Auth Hooks have no CLI/API registration path |
| Set Vercel environment variables | First project setup | Vercel Dashboard only; no CLI support for secret values |
| Set GitHub Actions secrets | First repo setup | GitHub secrets require dashboard or gh CLI with auth |
| Create GitHub Environment `production` with required reviewers | Before first production migration | GitHub UI only |
| Provision first admin with `provision_admin_user()` | New project / new tenant | Requires knowing the auth user UUID |
