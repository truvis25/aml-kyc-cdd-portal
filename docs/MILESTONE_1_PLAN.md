# Milestone 1 — First Implementation Plan
## Foundation: Auth, RBAC, Audit, Tenant Setup
> AML/KYC/CDD Portal · TruVis International Services
> Reference: DevPlan v1.0 Section 9 — Milestone 1
> Classification: Internal · Confidential · 2026

---

## PHASE E — Milestone 1 Restated Scope

Build and prove the compliance backbone before any customer data flows:

1. **Project scaffold** — Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Zod
2. **Supabase project** — CLI setup, extensions (pgcrypto, pg_cron, uuid-ossp), migrations baseline
3. **Vercel environments** — Production + staging from `main`/`staging` branches
4. **Core DB tables** — `tenants`, `users`, `user_roles`, `roles`, `audit_log`
5. **Audit immutability** — Append-only trigger + permission grants; hash chain; generic trigger on all compliance tables
6. **Supabase Auth** — email+password, email verification, TOTP MFA for Admin/MLRO
7. **JWT enrichment** — Edge Function adding `tenant_id`, `role`, `mfa_verified` to JWT
8. **RBAC** — All 7 roles defined; permission map; `modules/auth/rbac.ts`
9. **Supabase clients** — browser, server (cookies), admin (service role; Edge Functions only)
10. **Edge Middleware** — Auth guard, tenant resolution, MFA check at Vercel edge
11. **Auth UI** — Sign-in, email verification, TOTP MFA setup
12. **Invite flow** — Admin invites → user activates → correct role assigned
13. **Nav shell** — Role-adaptive sidebar and navigation
14. **Audit service** — `emit()`, `query()`, `export()` in `modules/audit/`

---

## First Implementation Checklist

### Step 1 — Project Scaffold (do first, everything else depends on it)
- [ ] Run `npx create-next-app@latest` with: TypeScript, App Router, Tailwind CSS, ESLint, `src/` = No
- [ ] Install additional dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [ ] Install shadcn/ui: `npx shadcn@latest init`
- [ ] Set TypeScript `strict: true` in `tsconfig.json`
- [ ] Configure path aliases: `@/modules/*`, `@/lib/*`, `@/components/*`
- [ ] Create all folders per DevPlan Section 10 with `.gitkeep` or stub files

### Step 2 — Supabase CLI Setup (parallel with Step 1 completion)
- [ ] `supabase init` in repo root
- [ ] Configure `supabase/config.toml`: project ref, schema, auth settings
- [ ] Create `supabase/seed/roles.sql` with the 7 platform roles
- [ ] Create `supabase/seed/test-tenant.sql` for local development

### Step 3 — Core Migrations (strictly sequential)
1. `0001_create_tenants.sql` — with RLS enabled
2. `0002_create_users_roles.sql` — with RLS + roles seed
3. `0003_create_audit_log.sql` — immutable table, no UPDATE/DELETE grant
4. `0004_audit_triggers.sql` — `prevent_audit_modification()` + `log_audit_event()` + attach to tenants + user_roles
5. Run `supabase db reset` — confirm all migrations apply cleanly

### Step 4 — Supabase Auth Configuration
- [ ] Enable email auth with email verification in Supabase dashboard or `config.toml`
- [ ] Enable TOTP MFA in Supabase dashboard
- [ ] [CONFIRM BEFORE BUILD] Decide MFA enforcement: Supabase Auth Hook vs JWT claim in middleware

### Step 5 — JWT Enrichment Edge Function (highest-risk item — build and test FIRST)
- [ ] Create `supabase/functions/enrich-jwt/index.ts`
- [ ] Function reads `user_roles` (active role) and `users` (mfa_enabled) via service role client
- [ ] Returns enriched claims: `{ tenant_id, role, mfa_verified, permissions }`
- [ ] Register as Auth Hook in Supabase dashboard
- [ ] **CRITICAL TEST:** Sign in → decode JWT → verify `tenant_id` and `role` present
- [ ] **CRITICAL TEST:** Sign in as Analyst → decode JWT → `role` = 'analyst'
- [ ] **CRITICAL TEST:** Simulate hook failure → verify user is NOT silently given access

### Step 6 — RBAC Module
- [ ] Create `lib/constants/roles.ts` — Role enum: `platform_super_admin | tenant_admin | mlro | senior_reviewer | analyst | onboarding_agent | read_only`
- [ ] Create `modules/auth/rbac.ts` — `hasPermission(role, action)` function + full permission matrix
- [ ] Create `lib/constants/events.ts` — AuditEventType enum for all event types
- [ ] Unit test every permission in the matrix

### Step 7 — Supabase Client Setup
- [ ] `lib/supabase/client.ts` — `createBrowserClient()` for React client components
- [ ] `lib/supabase/server.ts` — `createServerClient()` using cookies for RSC + API routes
- [ ] `lib/supabase/admin.ts` — `createAdminClient()` using SERVICE_ROLE_KEY; add ESLint rule to detect import outside `supabase/functions/`
- [ ] Test: server client returns correct session from RSC

### Step 8 — Edge Middleware
- [ ] `middleware.ts` — reads JWT from cookie, checks tenant match, MFA requirement, role gates
- [ ] Protected routes: all under `/(platform)/`
- [ ] Admin-only routes: `/(platform)/admin/`
- [ ] MLRO routes: `/(platform)/audit/`
- [ ] MFA required routes: `/(platform)/admin/`, `/(platform)/audit/`, any MLRO path
- [ ] Test: unauthenticated → `/sign-in`; analyst + `/admin` → 403; cross-tenant JWT → 403

### Step 9 — Auth UI
- [ ] `app/(auth)/sign-in/page.tsx` — email+password form using Supabase Auth client
- [ ] `app/(auth)/mfa-setup/page.tsx` — TOTP QR display + 6-digit code verification
- [ ] Error handling: generic error message (no user enumeration)
- [ ] Redirect after sign-in: to `/dashboard` with correct tenant context

### Step 10 — User Invitation Flow
- [ ] `app/api/admin/users/invite/route.ts` — POST handler: auth check, role check (admin only), call Supabase Admin `inviteUserByEmail`, create `user_roles` row, emit audit event
- [ ] `app/(platform)/admin/users/page.tsx` — User list table + invite modal
- [ ] Test: non-admin calling invite endpoint → 403

### Step 11 — Navigation Shell
- [ ] `app/(platform)/layout.tsx` — Authenticated wrapper with sidebar navigation
- [ ] `components/shared/navigation.tsx` — Role-conditional nav items per role matrix
- [ ] `components/shared/sidebar.tsx` — Fixed sidebar with TruVis branding placeholder

### Step 12 — Audit Service
- [ ] `modules/audit/audit.types.ts` — `AuditEvent` type, all `AuditEventType` values
- [ ] `modules/audit/audit.service.ts` — `emit(event)`: validates, computes `row_hash`, INSERTs; `query(filters)`: always filters by `tenant_id`; `export(filters)`: returns JSON-L
- [ ] Test: emit() → row_hash populated; query() with wrong tenant → empty array

### Step 13 — pgTAP Tests
- [ ] `tests/db/001_audit_immutability.sql` — UPDATE blocked, DELETE blocked, INSERT allowed, row_hash non-null
- [ ] `tests/db/002_rls_tenants.sql` — tenant_id A cannot read tenant B record
- [ ] `tests/db/003_rls_users.sql` — users cross-tenant isolation
- [ ] `tests/db/004_rls_user_roles.sql` — user_roles cross-tenant isolation
- [ ] Run all pgTAP tests against local Supabase: `supabase test db`

### Step 14 — Vercel Setup
- [ ] Connect repo to Vercel
- [ ] Create `main` → Production and `staging` → Staging environment mapping
- [ ] Add environment variables per `.env.example`
- [ ] [CONFIRM BEFORE BUILD] Select region: `me-1` (Middle East, Bahrain) or `fra1` (Frankfurt) based on UAE data residency requirement
- [ ] Confirm staging deployment accessible

---

## First Coding Tasks in Correct Order

```
1.  npx create-next-app@latest        ← scaffold
2.  Install deps + shadcn init         ← tooling
3.  Create folder structure            ← architecture
4.  supabase init + config.toml       ← DB tooling
5.  Write 0001_create_tenants.sql     ← first migration
6.  Write 0002_create_users_roles.sql ← second migration  
7.  Write 0003_create_audit_log.sql   ← MOST CRITICAL MIGRATION
8.  Write 0004_audit_triggers.sql     ← immutability enforcement
9.  supabase db reset (verify)        ← validate migrations
10. Configure Supabase Auth            ← auth foundation
11. Write enrich-jwt Edge Function    ← JWT enrichment (highest risk)
12. Test JWT claims (decode + verify)  ← validate JWT enrichment before proceeding
13. Write lib/constants/roles.ts       ← role definitions
14. Write modules/auth/rbac.ts         ← permission map
15. Write lib/supabase/client.ts       ← browser client
    Write lib/supabase/server.ts       ← server client  (parallel)
    Write lib/supabase/admin.ts        ← admin client   (parallel)
16. Write middleware.ts                ← edge auth guard
17. Build sign-in + MFA UI             ← auth flows
18. Build invite flow                  ← user management
19. Build nav shell                    ← authenticated layout
20. Write modules/audit/               ← audit service
21. Write pgTAP tests                  ← RLS verification
22. Configure Vercel                   ← deployment
23. Verify staging deployment          ← integration check
```

---

## Migrations to Create First (in this order)

| Order | Filename | Why First |
|---|---|---|
| 1 | `0001_create_tenants.sql` | All tables depend on tenants.id FK |
| 2 | `0002_create_users_roles.sql` | JWT enrichment reads from user_roles |
| 3 | `0003_create_audit_log.sql` | MOST CRITICAL — all compliance data depends on audit trail existing |
| 4 | `0004_audit_triggers.sql` | Immutability must be enforced immediately, before any data is written |

No other migrations should be created in Milestone 1. All subsequent table migrations (customers, documents, consent, screening, risk, cases, approvals) are Milestone 2+.

---

## Folders to Scaffold First

```
/
├── app/
│   ├── (auth)/sign-in/               ← Auth UI (M1)
│   ├── (auth)/mfa-setup/             ← MFA setup (M1)
│   ├── (platform)/layout.tsx         ← Nav shell (M1)
│   ├── (platform)/dashboard/         ← Dashboard stub (M1)
│   ├── (platform)/admin/users/       ← User management (M1)
│   └── api/admin/users/              ← Invite API (M1)
├── modules/
│   ├── audit/                        ← Audit service (M1)
│   └── auth/                         ← RBAC + auth service (M1)
├── lib/
│   ├── supabase/                     ← 3 clients (M1)
│   └── constants/                    ← roles, events (M1)
├── components/
│   ├── ui/                           ← shadcn base (M1)
│   └── shared/                       ← nav, sidebar, auth forms (M1)
├── supabase/
│   ├── config.toml
│   ├── migrations/                   ← 0001-0004 (M1)
│   ├── functions/enrich-jwt/         ← JWT hook (M1)
│   └── seed/                         ← roles + test-tenant (M1)
├── tests/
│   ├── db/                           ← pgTAP (M1)
│   └── unit/                         ← rbac.test.ts (M1)
└── middleware.ts                     ← Edge auth guard (M1)
```

**All other folders** (`modules/kyc-individual/`, `modules/documents/`, `modules/screening/`, `modules/risk/`, `modules/cases/`, etc.) — create as empty stubs with `.gitkeep` in M1 to establish structure, but NO code inside them until their respective milestones.

---

## Auth/RBAC/Audit Pieces That Must Be Built Before Anything Else

### 🔴 Absolute Must-Build-First Order:

**1. `audit_log` table with immutability trigger** (M1-T07, M1-T08)
> Every other table depends on audit trail being available. This is the first DB migration after `tenants` and `users`.

**2. JWT enrichment Edge Function** (M1-T10)
> RLS policies use `auth.jwt() ->> 'tenant_id'`. Without working JWT claims, ALL data isolation fails. This must be tested before building any RLS-protected feature.

**3. RLS policies on all M1 tables** (in each migration file)
> Every table created in M1 must have RLS enabled and at least a tenant isolation policy. No table is created without RLS in this platform.

**4. `modules/auth/rbac.ts`** (M1-T11)
> Every API route handler calls `hasPermission()`. This must exist before any API route is written.

**5. `middleware.ts`** (M1-T13)
> Auth guard must be in place before any UI route is deployed. Never deploy an authenticated route without the middleware protecting it.

---

## Confirmations Required Before Starting M1 Coding

| # | Question | Who Answers | Blocks |
|---|---|---|---|
| C-01 | Vercel region: `me-1` (Bahrain) or `fra1` (Frankfurt)? UAE data residency? | Product/Legal | Vercel project creation |
| C-02 | MFA enforcement: Supabase Auth Hook type? Database Webhook vs Auth Hook (Edge Function)? | Engineering | M1-T09, M1-T10 |
| C-10 | Shared schema + RLS acceptable for MVP (not schema-per-tenant)? | Product/CTO | All DB design |

> **These three must be answered before writing the first line of code for M1.**

---

## Definition of Done — Milestone 1

The following must ALL be true before Milestone 2 begins:

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `supabase db reset` runs without errors on all 4 migrations
- [ ] Sign in as Tenant Admin → dashboard shows; no other tenant's data visible
- [ ] Sign in as Analyst → `/admin` returns 403
- [ ] Sign in as MLRO (no MFA setup) → redirected to `/mfa-setup`
- [ ] Write audit event → UPDATE raises exception; DELETE raises exception
- [ ] JWT decoded after sign-in → `tenant_id`, `role`, `mfa_verified` present
- [ ] Invite user → email sent → user activates → logs in with correct role
- [ ] All 4 pgTAP test files pass: `supabase test db`
- [ ] `rbac.ts` unit tests pass: all role/action combinations correct
- [ ] No console.log statements with PII in any committed code
- [ ] `.env.example` complete with all M1 environment variables
- [ ] `CLAUDE.md` updated with: tech stack, dev commands, how to run migrations, how to run tests

---

## Environment Variables Required for M1

```bash
# Supabase (safe for server)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server-only — NEVER in NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=

# App config
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_TENANT_MODE=path  # or subdomain

# Supabase Edge Functions (stored in Supabase secrets, not .env)
# SUPABASE_SERVICE_ROLE_KEY already available as built-in secret
```

---

*Milestone 1 First Implementation Plan v1.0 · TruVis International Services · 2026*
