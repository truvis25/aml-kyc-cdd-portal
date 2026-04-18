# AML/KYC/CDD Portal — Master MVP To-Do List
> Source of truth: PRD v1.0 + Development Plan v1.0 · TruVis International Services
> Classification: Internal · Confidential · 2026

---

## LEGEND
- **Status**: `todo` | `in_progress` | `blocked` | `done`
- **[CONFIRM BEFORE BUILD]** — Requires a decision/confirmation before coding
- **[LEGAL / COMPLIANCE CHECK]** — Requires legal or MLRO sign-off before production

---

## MILESTONE 1 · Foundation — Auth, RBAC, Audit, Tenant Setup

> **Objective:** Establish the security and compliance backbone before any customer data flows. Auth, roles, RLS, and audit trail must be proven before onboarding is built.

---

### EPIC 1.1 · Project Scaffolding & Environment Setup

#### Task 1.1.1 — Initialize Next.js 16 App Router Project
- **Task ID:** M1-T01
- **Title:** Initialize Next.js 16 (App Router) with Tailwind CSS, shadcn/ui, Zod, TypeScript
- **Purpose:** Establish the frontend and API layer scaffold
- **Why it matters:** All modules build on this foundation; wrong scaffold = expensive rework
- **Dependencies:** None
- **Files/Folders affected:** `package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `components/ui/`, `lib/`
- **DB changes:** None
- **API changes:** None
- **UI changes:** Root layout, global styles
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** Use Node 20.x; no secrets in `.env.local` committed
- **Acceptance criteria:**
  - `npm run dev` starts without errors
  - App Router with TypeScript strict mode enabled
  - Tailwind + shadcn/ui base components installed
  - Zod installed for schema validation
- **Test checklist:**
  - [ ] `npm run build` succeeds with zero TS errors
  - [ ] Tailwind classes render correctly on a test page
- **Status:** `todo`

#### Task 1.1.2 — Repository Folder Structure per DevPlan Section 10
- **Task ID:** M1-T02
- **Title:** Create canonical folder structure (app/, modules/, lib/, components/, supabase/, tests/)
- **Purpose:** Enforce module boundaries and prevent cross-module coupling
- **Why it matters:** DevPlan Section 10 defines the explicit structure; deviation = architectural debt
- **Dependencies:** M1-T01
- **Files/Folders affected:** `modules/`, `lib/`, `components/`, `supabase/`, `tests/`, `app/api/`, `app/(auth)/`, `app/(onboarding)/`, `app/(platform)/`
- **DB changes:** None
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** `supabase/functions/` stubs created
- **Security / compliance:** No barrel re-exports across module boundaries (explicit imports only)
- **Acceptance criteria:**
  - All directories per DevPlan Section 10 exist with `.gitkeep` or stub files
  - `modules/` contains: `audit/`, `auth/`, `onboarding/`, `kyc-individual/`, `documents/`, `screening/`, `risk/`, `cases/`, `approvals/`, `consent/`, `notifications/`, `admin-config/`
- **Test checklist:**
  - [ ] Folder structure matches DevPlan Section 10 exactly
- **Status:** `todo`

#### Task 1.1.3 — Supabase CLI Project Initialisation
- **Task ID:** M1-T03
- **Title:** Initialize Supabase CLI project with config.toml, migrations folder, seed scripts
- **Purpose:** Establishes the database migration baseline used for all future schema changes
- **Why it matters:** All DB changes must go through Supabase CLI migrations — no manual SQL in production
- **Dependencies:** M1-T01
- **Files/Folders affected:** `supabase/config.toml`, `supabase/migrations/`, `supabase/seed/`
- **DB changes:** Extension setup (pgcrypto, pg_cron, uuid-ossp)
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** Edge Functions root structure `supabase/functions/`
- **Security / compliance:** Service role key stored in Edge Function secrets only — never in frontend
- **Acceptance criteria:**
  - `supabase start` runs locally
  - Extensions (pgcrypto, pg_cron, uuid-ossp) enabled via migration
  - `.env.local.example` documents required environment variables
- **Test checklist:**
  - [ ] `supabase db reset` runs without errors
  - [ ] Extensions visible in local Supabase dashboard
- **Status:** `todo`

#### Task 1.1.4 — Vercel Project Setup & Environment Configuration
- **Task ID:** M1-T04
- **Title:** Configure Vercel project (production + staging), environment variables, region selection
- **Purpose:** Deploy environments for production and staging
- **Why it matters:** Staging must use a separate Supabase instance; preview must never use production data
- **Dependencies:** M1-T01, M1-T03
- **Files/Folders affected:** `.env.example`, `vercel.json` (if needed)
- **DB changes:** None
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - `NEXT_PUBLIC_` prefix only for genuinely public config
  - All API keys server-only env vars
  - [CONFIRM BEFORE BUILD] Vercel region: `fra1` (Frankfurt) or `me-1` (Middle East) based on UAE data residency requirement
- **Acceptance criteria:**
  - Production and staging Vercel deployments active from `main` and `staging` branches
  - No secrets in version control
  - `.env.example` documents all required vars
- **Test checklist:**
  - [ ] Staging deployment accessible
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` visible in browser; service role key NOT visible
- **Status:** `todo`

---

### EPIC 1.2 · Database Schema — Core Tables

#### Task 1.2.1 — Migration 0001: tenants table
- **Task ID:** M1-T05
- **Title:** Create `tenants` table with RLS
- **Purpose:** Root entity for all multi-tenant data
- **Why it matters:** tenant_id is stamped on every table; this is the foundational record
- **Dependencies:** M1-T03
- **Files/Folders affected:** `supabase/migrations/0001_create_tenants.sql`
- **DB changes:**
  ```sql
  tenants (id UUID PK, slug TEXT UNIQUE, name TEXT, status TEXT, created_at TIMESTAMPTZ, settings JSONB)
  ```
- **API changes:** None yet
- **UI changes:** None yet
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** RLS enabled; no anonymous access; platform super-admin reads all
- **Acceptance criteria:**
  - Migration runs without errors
  - RLS prevents cross-tenant reads
- **Test checklist:**
  - [ ] pgTAP: user from tenant A cannot read tenant B record
- **Status:** `todo`

#### Task 1.2.2 — Migration 0002: users, user_roles, roles tables
- **Task ID:** M1-T06
- **Title:** Create `roles`, `users`, `user_roles` tables with RLS
- **Purpose:** Platform RBAC — role definitions and assignments per user per tenant
- **Why it matters:** Without roles, the review queue and case management cannot be role-gated
- **Dependencies:** M1-T05
- **Files/Folders affected:** `supabase/migrations/0002_create_users_roles.sql`
- **DB changes:**
  ```
  roles (id UUID PK, name TEXT UNIQUE, description TEXT)
  users (id UUID PK REFERENCES auth.users, tenant_id UUID FK, display_name TEXT, mfa_enabled BOOL, status TEXT)
  user_roles (id UUID PK, user_id UUID FK, tenant_id UUID FK, role_id UUID FK, granted_at TIMESTAMPTZ, granted_by UUID, revoked_at TIMESTAMPTZ)
  ```
  Note: `user_roles` is append-only; revocations create new row with `revoked_at`.
- **API changes:** None yet
- **UI changes:** None yet
- **Edge Function / webhook / cron impact:** `enrich-jwt` Edge Function reads from this table
- **Security / compliance:** RLS enforced; users cannot read other tenants' user_roles; MFA flag read by middleware
- **Acceptance criteria:**
  - Role seed data: platform_super_admin, tenant_admin, mlro, senior_reviewer, analyst, onboarding_agent, read_only
  - User-roles RLS: authenticated users see only their tenant's users
- **Test checklist:**
  - [ ] pgTAP: analyst cannot read another tenant's user records
  - [ ] Seed roles inserted correctly
- **Status:** `todo`

#### Task 1.2.3 — Migration 0003: audit_log table (append-only, hash chain)
- **Task ID:** M1-T07
- **Title:** Create `audit_log` table with append-only enforcement, hash chaining, and Postgres trigger
- **Purpose:** Immutable, tamper-evident record of all compliance events
- **Why it matters:** UAE AML Law Art. 14, ADGM Rules 10 — regulatory obligation from day one; MUST be first
- **Dependencies:** M1-T05
- **Files/Folders affected:** `supabase/migrations/0003_create_audit_log.sql`, `supabase/migrations/0004_audit_triggers.sql`
- **DB changes:**
  ```
  audit_log:
    id UUID PK DEFAULT gen_random_uuid()
    tenant_id UUID NOT NULL REFERENCES tenants(id)
    event_time TIMESTAMPTZ NOT NULL DEFAULT now()
    event_type TEXT NOT NULL
    actor_id UUID (nullable — NULL for system events)
    actor_role TEXT
    entity_type TEXT NOT NULL
    entity_id UUID NOT NULL
    payload JSONB NOT NULL
    session_id UUID
    ip_address INET (masked to /24)
    prev_hash TEXT
    row_hash TEXT GENERATED (SHA-256 of concatenated key fields)
  ```
  Trigger: `prevent_audit_modification()` — raises exception on UPDATE or DELETE.
  Grant: `GRANT INSERT ON audit_log TO authenticated` — NO UPDATE, NO DELETE.
- **API changes:** None yet
- **UI changes:** None yet
- **Edge Function / webhook / cron impact:** All Edge Functions write to audit_log
- **Security / compliance:**
  - [LEGAL / COMPLIANCE CHECK] Hash chaining implemented per PRD Section 4.4
  - Trigger-level protection as secondary control to grant-level protection
  - `row_hash` computed in Postgres using pgcrypto
- **Acceptance criteria:**
  - INSERT succeeds; UPDATE raises exception; DELETE raises exception
  - `row_hash` is populated automatically
  - `prev_hash` correctly references previous row for same tenant
- **Test checklist:**
  - [ ] pgTAP: INSERT succeeds
  - [ ] pgTAP: UPDATE on audit_log raises exception
  - [ ] pgTAP: DELETE on audit_log raises exception
  - [ ] pgTAP: row_hash is non-null after insert
- **Status:** `todo`

#### Task 1.2.4 — Migration 0004: Generic audit trigger function
- **Task ID:** M1-T08
- **Title:** Create reusable `log_audit_event()` trigger function, attach to all compliance tables
- **Purpose:** Ensure audit events are captured even if application code forgets to call audit service
- **Why it matters:** Compliance defence-in-depth; per DevPlan Section 8.4: "missing audit write is a blocking defect"
- **Dependencies:** M1-T07
- **Files/Folders affected:** `supabase/migrations/0004_audit_triggers.sql`
- **DB changes:** PL/pgSQL trigger function; attached to tenants, users, user_roles tables initially; extended in later migrations for all compliance tables
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** None (DB-side trigger)
- **Security / compliance:** Trigger runs as SECURITY DEFINER to write to audit_log regardless of caller permissions
- **Acceptance criteria:**
  - Insert a tenant record → audit_log receives a `tenant.created` event
  - Update a user role → audit_log receives a `user_role.changed` event
- **Test checklist:**
  - [ ] pgTAP: insert into tenants → audit_log has matching event
  - [ ] pgTAP: insert into user_roles → audit_log has event with correct entity_type
- **Status:** `todo`

---

### EPIC 1.3 · Supabase Auth & JWT Enrichment

#### Task 1.3.1 — Supabase Auth Configuration
- **Task ID:** M1-T09
- **Title:** Configure Supabase Auth: email+password, email verification, TOTP MFA
- **Purpose:** Platform authentication foundation
- **Why it matters:** Cannot assign roles or enforce RBAC without authenticated users
- **Dependencies:** M1-T03
- **Files/Folders affected:** `supabase/config.toml`, Supabase dashboard Auth settings
- **DB changes:** Supabase auth schema (managed by Supabase)
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** `enrich-jwt` hook fires on every sign-in
- **Security / compliance:**
  - Email verification mandatory before access
  - TOTP MFA mandatory for tenant_admin and mlro roles
  - [CONFIRM BEFORE BUILD] MFA enforcement via JWT claim check in middleware vs Supabase Auth hook
- **Acceptance criteria:**
  - New user cannot sign in without email verification
  - Tenant Admin prompted for MFA setup on first login
- **Test checklist:**
  - [ ] Unverified user blocked from dashboard
  - [ ] Tenant Admin without MFA redirected to MFA setup
- **Status:** `todo`

#### Task 1.3.2 — JWT Enrichment Edge Function (enrich-jwt)
- **Task ID:** M1-T10
- **Title:** Create `enrich-jwt` Supabase Edge Function (Auth hook) — adds tenant_id, role, permissions, mfa_verified to JWT
- **Purpose:** Make tenant context and role available in every JWT for RLS policies and middleware
- **Why it matters:** RLS policies use `auth.jwt() ->> 'tenant_id'`; without this claim, ALL data isolation fails
- **Dependencies:** M1-T06, M1-T09
- **Files/Folders affected:** `supabase/functions/enrich-jwt/index.ts`, `modules/auth/auth.types.ts`
- **DB changes:** Reads `user_roles` and `users` tables
- **API changes:** None (Auth hook, not API)
- **UI changes:** None
- **Edge Function / webhook / cron impact:** Fires on every successful auth event
- **Security / compliance:**
  - Service role key used in Edge Function — never in frontend
  - If claims enrichment fails, force re-authentication (fail closed, not open)
  - [CONFIRM BEFORE BUILD] Supabase Auth hook type: Database Webhook vs Edge Function Auth Hook
- **Acceptance criteria:**
  - JWT contains `tenant_id`, `role`, `mfa_verified` after sign-in
  - RLS policy using `auth.jwt() ->> 'tenant_id'` correctly filters data
  - Missing claims trigger re-auth, not silent bypass
- **Test checklist:**
  - [ ] Decode JWT after sign-in: tenant_id present
  - [ ] RLS test: query returns only current tenant's rows
  - [ ] Simulate enrichment failure → user is redirected to sign-in
- **Status:** `todo`

---

### EPIC 1.4 · RBAC & Auth Module

#### Task 1.4.1 — RBAC Role Definitions and Permission Map
- **Task ID:** M1-T11
- **Title:** Define all roles, permissions, and permission checks in `modules/auth/rbac.ts`
- **Purpose:** Single source of truth for what each role can do
- **Why it matters:** Permissions checked in both API routes and UI; divergence = security gap
- **Dependencies:** M1-T06
- **Files/Folders affected:** `modules/auth/rbac.ts`, `modules/auth/auth.types.ts`, `lib/constants/roles.ts`
- **DB changes:** None (roles seeded in M1-T06)
- **API changes:** Used in every API route handler
- **UI changes:** Used in every protected page component
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - Role: platform_super_admin — cross-tenant config only, no customer PII
  - Role: tenant_admin — all own-tenant data, no MLRO decisions
  - Role: mlro — all case access, SAR visibility, audit read
  - Role: senior_reviewer — assigned cases, EDD review
  - Role: analyst — assigned cases only, no high-risk approval solo
  - Role: onboarding_agent — initiate session, upload docs, no EDD
  - Role: read_only — aggregate anonymised data only
- **Acceptance criteria:**
  - `hasPermission(role, action)` returns correct boolean for all role/action combinations
  - Permission matrix documented in code comments
- **Test checklist:**
  - [ ] Unit: analyst cannot `approve_high_risk_case`
  - [ ] Unit: mlro can `view_sar_status`
  - [ ] Unit: read_only cannot `read_individual_customer_pii`
- **Status:** `todo`

#### Task 1.4.2 — Auth Service (lib/supabase client setup)
- **Task ID:** M1-T12
- **Title:** Create Supabase client instances: browser client, server client (cookies), admin client
- **Purpose:** Typed, consistent Supabase clients used across the application
- **Why it matters:** Wrong client choice (e.g. using anon client server-side) bypasses RLS
- **Dependencies:** M1-T03, M1-T09
- **Files/Folders affected:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- **DB changes:** None
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** `admin.ts` used in Edge Functions (service role) only
- **Security / compliance:**
  - `admin.ts` only imported inside `supabase/functions/**` — never in `app/` or `modules/`
  - Server client uses cookies-based auth for SSR
- **Acceptance criteria:**
  - Browser client correctly handles auth state changes
  - Server client returns correct session from cookies in RSC
  - Admin client uses `SUPABASE_SERVICE_ROLE_KEY` (server-only env var)
- **Test checklist:**
  - [ ] Build fails if `admin.ts` is imported in any `app/` file (lint rule)
- **Status:** `todo`

#### Task 1.4.3 — Edge Middleware: Auth Guard, Tenant Resolution, MFA Check
- **Task ID:** M1-T13
- **Title:** Create `middleware.ts` — JWT validation, tenant resolution from URL, auth guard, MFA enforcement
- **Purpose:** Protect all authenticated routes at the edge before any RSC or API route runs
- **Why it matters:** Edge middleware is the security perimeter; authenticated pages must not render without valid session
- **Dependencies:** M1-T10, M1-T11, M1-T12
- **Files/Folders affected:** `middleware.ts`
- **DB changes:** None (reads JWT only — no DB calls in middleware)
- **API changes:** None
- **UI changes:** Redirect logic
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - No DB calls in middleware (Vercel Edge constraint + security: rely on signed JWT)
  - Tenant resolved from subdomain or path prefix; JWT claim validated against resolved tenant
  - `mfa_verified` claim checked for admin and mlro routes before allowing access
  - Unauthenticated requests → redirect to `/sign-in`
  - Wrong-tenant JWT → 403 (never silently serve wrong tenant's data)
- **Acceptance criteria:**
  - Unauthenticated user accessing `/cases` → redirected to `/sign-in`
  - Analyst accessing `/admin` → 403 Forbidden
  - MLRO without MFA accessing `/cases` → redirected to `/mfa-setup`
  - Valid Tenant A JWT accessing Tenant B URL → 403
- **Test checklist:**
  - [ ] Integration: unauthenticated → redirect
  - [ ] Integration: analyst → admin route → 403
  - [ ] Integration: cross-tenant JWT → 403
- **Status:** `todo`

---

### EPIC 1.5 · Tenant & User Management UI

#### Task 1.5.1 — Sign-In, Email Verification, MFA Setup Flow
- **Task ID:** M1-T14
- **Title:** Build auth UI: sign-in page, email verification flow, TOTP MFA setup and verification screens
- **Purpose:** Users can authenticate and set up MFA
- **Why it matters:** No platform access without auth; MFA is mandatory for MLRO and Admin
- **Dependencies:** M1-T09, M1-T12, M1-T13
- **Files/Folders affected:** `app/(auth)/sign-in/`, `app/(auth)/mfa-setup/`, `components/shared/auth-forms.tsx`
- **DB changes:** None (Supabase Auth handles)
- **API changes:** None (Supabase Auth client calls)
- **UI changes:** Sign-in form, email verification message, TOTP QR code setup
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - TOTP QR code only shown once; re-setup requires admin action
  - No PII in error messages (no "email not found" distinction from "wrong password")
  - Failed login events logged to audit_log
- **Acceptance criteria:**
  - User signs in with email+password → JWT set → redirected to dashboard
  - Tenant Admin first login → prompted for MFA → TOTP QR shown → verified
  - Failed sign-in → generic error (no user enumeration)
- **Test checklist:**
  - [ ] E2E: full sign-in flow for Analyst role
  - [ ] E2E: MFA setup flow for Tenant Admin
  - [ ] E2E: failed login shows generic message
- **Status:** `todo`

#### Task 1.5.2 — User Invitation Flow (Admin creates and invites users)
- **Task ID:** M1-T15
- **Title:** Implement user invitation: Admin sends invite → user activates account → role assigned
- **Purpose:** Users cannot self-register; all access is invitation-gated
- **Why it matters:** AML platforms must not have open self-registration; all users are vetted staff
- **Dependencies:** M1-T06, M1-T14
- **Files/Folders affected:** `app/(platform)/admin/users/`, `app/api/admin/users/route.ts`, `modules/auth/auth.service.ts`
- **DB changes:** `user_roles` record created at invitation time
- **API changes:** `POST /api/admin/users/invite`
- **UI changes:** User management page, invitation form, role selection dropdown
- **Edge Function / webhook / cron impact:** None (Supabase Auth sends invite email)
- **Security / compliance:**
  - Only tenant_admin and platform_super_admin can invite users
  - Role assignment validated server-side (cannot self-elevate to MLRO)
  - Invitation creates audit event
- **Acceptance criteria:**
  - Tenant Admin invites new Analyst → email sent → user activates → logs in with Analyst role
  - Analyst cannot access `/admin/users`
  - Invitation creates `user_roles` row and audit event
- **Test checklist:**
  - [ ] E2E: complete invitation → activation → login flow
  - [ ] API: non-admin cannot call invite endpoint (403)
  - [ ] DB: user_roles row present after invite
  - [ ] Audit: `user.invited` event in audit_log
- **Status:** `todo`

#### Task 1.5.3 — Role-Based Navigation Shell (Authenticated Layout)
- **Task ID:** M1-T16
- **Title:** Create authenticated platform layout with role-adaptive navigation
- **Purpose:** Platform shell that shows/hides nav items based on user role
- **Why it matters:** Analysts must not see MLRO-only sections; defence-in-depth on top of middleware
- **Dependencies:** M1-T11, M1-T13, M1-T14
- **Files/Folders affected:** `app/(platform)/layout.tsx`, `components/shared/navigation.tsx`, `components/shared/sidebar.tsx`
- **DB changes:** None
- **API changes:** None
- **UI changes:** Sidebar navigation, top bar with user info and sign-out
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** Nav items rendered conditionally by role; route-level protection still in middleware
- **Acceptance criteria:**
  - Analyst sees: Cases, Customers nav items
  - MLRO sees: Cases, Customers, Audit Trail, Risk Config nav items
  - Tenant Admin sees: Cases, Users, Admin Config, Workflows nav items
  - All see: Dashboard
- **Test checklist:**
  - [ ] Unit: navigation renders correct items per role
  - [ ] E2E: analyst cannot navigate to `/admin` via URL bar (middleware blocks)
- **Status:** `todo`

---

### EPIC 1.6 · Audit Trail Verification

#### Task 1.6.1 — Audit Service Module
- **Task ID:** M1-T17
- **Title:** Create `modules/audit/audit.service.ts` with `emit()`, `query()`, `export()` methods
- **Purpose:** Typed, centralized interface for writing and reading audit events
- **Why it matters:** Every module calls `audit.emit()`; inconsistent calling patterns = missed events
- **Dependencies:** M1-T07, M1-T12
- **Files/Folders affected:** `modules/audit/audit.service.ts`, `modules/audit/audit.types.ts`
- **DB changes:** Uses `audit_log` table via INSERT only
- **API changes:** `GET /api/audit` (MLRO/Admin only)
- **UI changes:** None (used server-side)
- **Edge Function / webhook / cron impact:** Called from all Edge Functions
- **Security / compliance:**
  - `emit()` wraps INSERT with error handling: if audit write fails, throw (transaction-safe)
  - `query()` enforces `tenant_id` filter always — never global query
  - `export()` generates structured audit report (JSON-L)
- **Acceptance criteria:**
  - `emit()` writes event with correct `row_hash`
  - `query()` returns only current tenant's events
  - `export()` generates valid JSON-L output
- **Test checklist:**
  - [ ] Unit: `emit()` succeeds and row_hash is populated
  - [ ] Unit: `query()` with wrong tenant returns empty
  - [ ] Integration: full audit trail for a test session has all expected events
- **Status:** `todo`

---

## MILESTONE 2 · Consent, Onboarding Session, Individual KYC Form

> **Objective:** Customer-facing onboarding journey — consent capture, personal data collection, document upload.

---

### EPIC 2.1 · Consent Module

#### Task 2.1.1 — Migration: consent_records table
- **Task ID:** M2-T01
- **Title:** Create `consent_records` table (append-only)
- **Purpose:** Immutable record of customer consent per purpose per version
- **Why it matters:** UAE PDPL 45/2021, ADGM DPR 2021 — consent must be provable before any PII processing
- **Dependencies:** M1 complete
- **Files/Folders affected:** `supabase/migrations/0011_create_consent.sql`
- **DB changes:** `consent_records(id, tenant_id, customer_id, session_id, purpose_code, notice_version, lawful_basis, captured_at, ip_address, withdrawal_at)`
- **API changes:** `POST /api/consent`, `GET /api/consent/[customerId]`
- **UI changes:** Consent capture screen (step 1 of onboarding)
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - [LEGAL / COMPLIANCE CHECK] Consent notice text must be reviewed by legal before production deployment
  - Append-only: no UPDATE, no DELETE
  - `captured_at` set by DB (not application)
- **Acceptance criteria:**
  - Consent record created → immutable
  - Withdrawal creates new row with `withdrawal_at` — does not delete original
- **Test checklist:**
  - [ ] pgTAP: UPDATE on consent_records raises exception
  - [ ] API: `POST /api/consent` returns 201 and creates row
  - [ ] Audit: `consent.captured` event in audit_log
- **Status:** `todo`

#### Task 2.1.2 — Consent Capture UI and API
- **Task ID:** M2-T02
- **Title:** Build consent capture screen with purposes, notice version, and lawful basis display
- **Purpose:** Legally compliant PII consent before any data collection
- **Why it matters:** PDPL/DPR obligation — no PII may be collected without documented consent
- **Dependencies:** M2-T01
- **Files/Folders affected:** `app/(onboarding)/[tenantSlug]/onboard/[sessionId]/consent/page.tsx`, `modules/consent/consent.service.ts`
- **DB changes:** Writes to `consent_records`
- **API changes:** `POST /api/consent`
- **UI changes:** Consent form with checkbox per purpose, notice display, submit
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - [LEGAL / COMPLIANCE CHECK] Confirm consent language with legal before production
  - No pre-checked consent boxes
  - Mandatory purposes cannot be unchecked (but reason displayed)
- **Acceptance criteria:**
  - Customer sees consent form → accepts → `consent_records` row created
  - Consent refusal → session cannot proceed to data collection
- **Test checklist:**
  - [ ] E2E: consent accepted → onboarding proceeds
  - [ ] E2E: consent refused → onboarding blocked
  - [ ] DB: consent_records row exists with correct purpose_codes
- **Status:** `todo`

---

### EPIC 2.2 · Onboarding Session Engine

#### Task 2.2.1 — Migrations: onboarding_sessions, customers, customer_data_versions
- **Task ID:** M2-T03
- **Title:** Create core onboarding data tables
- **Purpose:** Session state, customer master record, field change versioning
- **Why it matters:** Session must be resumable; all field changes must be versioned
- **Dependencies:** M2-T01
- **Files/Folders affected:** `supabase/migrations/0005_create_customers.sql`, `supabase/migrations/0012_create_sessions.sql`
- **DB changes:**
  ```
  onboarding_sessions(id, tenant_id, customer_id, workflow_id, current_step_id, status, started_at, completed_at, metadata JSONB)
  customers(id, tenant_id, status, risk_band, created_at, relationship_ended_at, retention_expires_at, deleted_at)
  customer_data_versions(id, customer_id, tenant_id, changed_at, changed_by, field_name, old_value_hash, new_value_hash, version_number)
  ```
- **API changes:** `POST /api/sessions`, `GET /api/sessions/[id]`
- **UI changes:** None yet
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** `customer_data_versions` is append-only; customer_id never exposed in URLs raw
- **Acceptance criteria:**
  - Session created with correct customer_id linkage
  - customer_data_versions row created on every field update
- **Test checklist:**
  - [ ] pgTAP: customer_data_versions INSERT only
  - [ ] API: `POST /api/sessions` returns session_id
- **Status:** `todo`

#### Task 2.2.2 — WorkflowEngine TypeScript Class
- **Task ID:** M2-T04
- **Title:** Implement `WorkflowEngine` class in `modules/onboarding/engine.ts`
- **Purpose:** JSON-defined state machine that drives the onboarding step sequence
- **Why it matters:** All step sequencing, branching, and routing logic must be data-driven — not hardcoded
- **Dependencies:** M2-T03
- **Files/Folders affected:** `modules/onboarding/engine.ts`, `modules/onboarding/onboarding.types.ts`, `supabase/migrations/0013_create_workflows.sql`
- **DB changes:** `workflow_definitions(id, tenant_id, customer_type, version, definition JSONB, is_active, created_at, created_by)` — versioned, never overwritten
- **API changes:** `GET /api/sessions/[id]` → returns current step from engine
- **UI changes:** None (consumed by session API)
- **Edge Function / webhook / cron impact:** Engine called from Edge Functions for async step advancement
- **Security / compliance:** Workflow version locked to session at creation time — cannot be changed mid-session
- **Acceptance criteria:**
  - `WorkflowEngine.loadDefinition()` returns correct definition for tenant + customer_type
  - `WorkflowEngine.advance()` correctly transitions to next step
  - `WorkflowEngine.evaluateBranch()` correctly routes based on risk_band
  - Default individual KYC workflow definition inserted via seed
- **Test checklist:**
  - [ ] Unit: advance() from consent → personal-data
  - [ ] Unit: evaluateBranch() with risk_band=HIGH → edd-review branch
  - [ ] Unit: advance() on completed session → throws
- **Status:** `todo`

#### Task 2.2.3 — Personal Data Collection Form (M-02 fields)
- **Task ID:** M2-T05
- **Title:** Build personal data collection form with all PRD Section 4.1.1 required fields, Zod validation
- **Purpose:** Collect the mandatory individual KYC fields
- **Why it matters:** PRD specifies 20+ fields with R/O/C status; all Required fields must be present
- **Dependencies:** M2-T03, M2-T04
- **Files/Folders affected:** `app/(onboarding)/[tenantSlug]/onboard/[sessionId]/identity/page.tsx`, `lib/validations/kyc.ts`
- **DB changes:** Writes to `customer_data_versions`
- **API changes:** `PATCH /api/customers/[id]/data`
- **UI changes:** Multi-field form with validation (full_name, dob, nationality, address, occupation, source_of_funds, purpose_of_relationship, PEP declaration, etc.)
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - [LEGAL / COMPLIANCE CHECK] PEP self-declaration triggers EDD — confirm threshold for automatic EDD trigger
  - No raw PII in API error responses
  - All field submissions write to customer_data_versions (not update customer row directly)
- **Acceptance criteria:**
  - All Required fields validated before form submission
  - PEP self-declaration = Yes → flagged on customer record
  - Form data stored in `customer_data_versions`, not overwriting
- **Test checklist:**
  - [ ] Zod: all required fields fail if empty
  - [ ] API: PATCH creates customer_data_versions row
  - [ ] Audit: `customer.field_changed` event for each field
- **Status:** `todo`

---

### EPIC 2.3 · Document Management

#### Task 2.3.1 — Migration: documents, document_events tables
- **Task ID:** M2-T06
- **Title:** Create `documents` and `document_events` tables; configure Supabase Storage bucket
- **Purpose:** Store document metadata and immutable event log for document lifecycle
- **Why it matters:** Documents are the primary evidence for KYC compliance; metadata immutable after upload
- **Dependencies:** M2-T03
- **Files/Folders affected:** `supabase/migrations/0006_create_documents.sql`
- **DB changes:**
  ```
  documents(id, tenant_id, customer_id, session_id, document_type, storage_path, file_hash, file_size, mime_type, status, uploaded_at, ocr_result JSONB, expiry_date)
  document_events(id, document_id, tenant_id, event_type, actor_id, occurred_at, metadata JSONB)
  ```
- **API changes:** `POST /api/documents/upload-url`, `GET /api/documents/[id]`
- **UI changes:** None yet
- **Edge Function / webhook / cron impact:** Storage trigger fires `compute-document-hash` Edge Function
- **Security / compliance:**
  - `documents` record is immutable after upload (status updates via `document_events`)
  - No public URLs — signed URL only
  - `storage_path` set to null + `file_hash` updated to "DELETED" when retention expires
- **Acceptance criteria:**
  - Document upload creates `documents` row with status=pending_hash
  - `document_events` receives upload event
  - `file_hash` populated by Edge Function after upload
- **Test checklist:**
  - [ ] pgTAP: document_events is append-only
  - [ ] Integration: upload → document row created → hash populated
- **Status:** `todo`

#### Task 2.3.2 — Document Upload Flow (Signed URL pattern)
- **Task ID:** M2-T07
- **Title:** Implement direct-to-Storage upload: generate signed upload URL server-side → browser uploads direct → metadata recorded
- **Purpose:** Secure document upload without routing file bytes through Vercel
- **Why it matters:** DevPlan Section 8.2: "no document data passes through Vercel"; Vercel 4.5MB body limit would break large doc uploads
- **Dependencies:** M2-T06
- **Files/Folders affected:** `modules/documents/documents.service.ts`, `app/api/documents/upload-url/route.ts`, `app/(onboarding)/[tenantSlug]/onboard/[sessionId]/documents/page.tsx`
- **DB changes:** Creates `documents` row before upload (pending status)
- **API changes:** `POST /api/documents/upload-url` → returns `{ signed_upload_url, document_id }`
- **UI changes:** Document upload UI with drag-and-drop, type selection (passport/national_id/proof_of_address)
- **Edge Function / webhook / cron impact:** `compute-document-hash` triggered on Storage insert
- **Security / compliance:**
  - 3-step access check before generating upload URL: auth → role → tenant match
  - Max file size: 20MB; allowed types: PDF, JPG, PNG, HEIC
  - Signed upload URL is single-use and short-TTL
- **Acceptance criteria:**
  - API returns signed URL; browser uploads direct to Supabase Storage
  - `documents` row created with pending status; updated with hash after Edge Function runs
  - File not accessible without fresh signed download URL
- **Test checklist:**
  - [ ] Upload passport → documents row created → file_hash populated
  - [ ] GET /api/documents/[id] without auth → 401
  - [ ] Wrong tenant's document → 403
  - [ ] Signed URL expires after 15 minutes
- **Status:** `todo`

#### Task 2.3.3 — Document Hash Computation Edge Function
- **Task ID:** M2-T08
- **Title:** Create `compute-document-hash` Supabase Edge Function (Storage trigger)
- **Purpose:** Compute SHA-256 of uploaded document and store in documents.file_hash
- **Why it matters:** File hash is tamper evidence for the document; must be computed at upload time from server-side
- **Dependencies:** M2-T06
- **Files/Folders affected:** `supabase/functions/compute-document-hash/index.ts`
- **DB changes:** Updates `documents.file_hash`, `documents.status` to `hash_computed`
- **API changes:** None (triggered by Storage event)
- **UI changes:** None
- **Edge Function / webhook / cron impact:** Triggered on Storage `INSERT` event for documents bucket
- **Security / compliance:** Uses service role key (stored in Edge Function secrets). Never exposed to browser.
- **Acceptance criteria:**
  - File uploaded → Edge Function fires → `file_hash` (SHA-256) populated within 10 seconds
  - Hash verified: download file, compute SHA-256 independently, values match
- **Test checklist:**
  - [ ] Integration: upload → hash populated
  - [ ] Hash matches independently computed SHA-256
- **Status:** `todo`

---

## MILESTONE 3 · IDV, Screening, Risk Scoring, Case Management

> **Objective:** Implement automated compliance checks (KYC verification, sanctions screening, risk score) and the analyst review queue.

---

### EPIC 3.1 · Identity Verification (IDV)

#### Task 3.1.1 — IDV Provider Integration (Sumsub)
- **Task ID:** M3-T01
- **Title:** Integrate Sumsub IDV: initiate check, receive webhook, update kyc_results
- **Purpose:** Liveness detection, biometric match, document authenticity — core KYC obligation
- **Why it matters:** KYC cannot be completed without IDV provider verification result
- **Dependencies:** M2 complete, Sumsub account with API credentials
- **Files/Folders affected:** `modules/kyc-individual/kyc.service.ts`, `supabase/functions/process-idv-webhook/index.ts`, `app/api/webhooks/idv/route.ts`
- **DB changes:** `kyc_results(id, customer_id, tenant_id, provider, provider_reference_id, liveness_pass, biometric_score, document_authenticity_pass, ocr_confidence, status, raw_result JSONB, created_at)` — immutable
- **API changes:** `POST /api/webhooks/idv`, `GET /api/customers/[id]` (includes kyc_results)
- **UI changes:** IDV step in onboarding (Sumsub Web SDK embedded)
- **Edge Function / webhook / cron impact:** `process-idv-webhook` processes async result; `webhook_events` queue for reliability
- **Security / compliance:**
  - [CONFIRM BEFORE BUILD] Sumsub UAE data processing satisfies UAE PDPL — confirm with legal
  - Webhook signature verified before processing
  - kyc_results is immutable after creation
  - [LEGAL / COMPLIANCE CHECK] Biometric data classified as sensitive under UAE PDPL Art. 4
- **Acceptance criteria:**
  - Submit onboarding → IDV initiated → Sumsub webhook received → `kyc_results` row created immutably
  - Liveness pass/fail correctly stored
  - Biometric match score stored
- **Test checklist:**
  - [ ] Mock webhook: kyc_results row created
  - [ ] Replay same webhook (idempotency): no duplicate row
  - [ ] Failed webhook → retried by pg_cron
  - [ ] Audit: `kyc.result_received` event
- **Status:** `todo`

#### Task 3.1.2 — Webhook Events Queue (Reliable Async Processing)
- **Task ID:** M3-T02
- **Title:** Create `webhook_events` queue table + retry pg_cron job
- **Purpose:** Reliable processing of IDV and screening webhooks even if Edge Function fails
- **Why it matters:** Missed webhook = customer stuck in pending state; compliance audit gap
- **Dependencies:** M1 complete (audit_log, pg_cron)
- **Files/Folders affected:** `supabase/migrations/` (webhook_events table), `supabase/functions/retry-failed-webhooks/index.ts`
- **DB changes:** `webhook_events(id, tenant_id, event_type, payload JSONB, status, attempts, last_attempted_at, processed_at, error_message)`
- **API changes:** None
- **UI changes:** None
- **Edge Function / webhook / cron impact:** pg_cron job: hourly retry of failed webhooks
- **Security / compliance:** Webhook payloads stored temporarily; PII minimised in queue
- **Acceptance criteria:**
  - Webhook received → written to queue → processed → status=processed
  - Simulated failure → status=failed → pg_cron retries → processes successfully
  - After 5 attempts → status=dead_letter → alert emitted
- **Test checklist:**
  - [ ] Integration: webhook → processed from queue
  - [ ] Integration: failed processing → retried after 1 hour
- **Status:** `todo`

---

### EPIC 3.2 · Screening Engine

#### Task 3.2.1 — Migration: screening_jobs, screening_hits, screening_hit_resolutions
- **Task ID:** M3-T03
- **Title:** Create screening data tables
- **Purpose:** Store screening jobs, hits, and analyst resolutions
- **Why it matters:** AML screening results are immutable evidence; resolutions are append-only
- **Dependencies:** M2 complete
- **Files/Folders affected:** `supabase/migrations/0007_create_screening.sql`
- **DB changes:**
  ```
  screening_jobs(id, customer_id, tenant_id, provider, list_versions JSONB, status, initiated_at, completed_at)
  screening_hits(id, job_id, customer_id, tenant_id, source_list, matched_entity, matched_fields, fuzzy_score, hit_type, created_at)
  screening_hit_resolutions(id, hit_id, tenant_id, resolved_by, resolution, rationale, resolved_at)
  ```
  All three tables: append-only enforcement.
- **API changes:** `POST /api/screening/[customerId]`, `GET /api/screening/jobs/[jobId]`, `POST /api/screening/hits/[hitId]/resolve`
- **UI changes:** Screening results in case detail view
- **Edge Function / webhook / cron impact:** `process-screening-webhook` processes async results
- **Security / compliance:**
  - [CONFIRM BEFORE BUILD] UAE Executive Office for Control and Non-Proliferation list coverage in ComplyAdvantage
  - screening_hit_resolutions: append-only; analyst rationale stored with actor_id
- **Acceptance criteria:**
  - Screening job created → results stored as hits → analyst resolves hit → resolution immutable
- **Test checklist:**
  - [ ] pgTAP: screening_hit_resolutions is append-only
  - [ ] Audit: all three event types logged
- **Status:** `todo`

#### Task 3.2.2 — Screening Adapter Pattern + ComplyAdvantage Adapter
- **Task ID:** M3-T04
- **Title:** Implement `ScreeningAdapter` interface + `ComplyAdvantageAdapter` + `MockScreeningAdapter`
- **Purpose:** Provider-agnostic screening — change provider without changing business logic
- **Why it matters:** Screening provider lock-in risk is HIGH per DevPlan Section 11.3
- **Dependencies:** M3-T03
- **Files/Folders affected:** `modules/screening/adapters/ScreeningAdapter.ts`, `modules/screening/adapters/ComplyAdvantageAdapter.ts`, `modules/screening/adapters/MockScreeningAdapter.ts`
- **DB changes:** None
- **API changes:** None (internal module)
- **UI changes:** None
- **Edge Function / webhook / cron impact:** `process-screening-webhook` uses adapter to parse webhook
- **Security / compliance:** API credentials stored in Edge Function secrets only
- **Acceptance criteria:**
  - `MockScreeningAdapter` used in test/dev; `ComplyAdvantageAdapter` in staging/prod
  - Switching adapter in factory does not require code changes to screening service
- **Test checklist:**
  - [ ] Unit: MockAdapter returns predictable test hits
  - [ ] Unit: screening.service.ts is agnostic to adapter type
- **Status:** `todo`

---

### EPIC 3.3 · Risk Scoring Engine

#### Task 3.3.1 — Migration: risk_assessments table
- **Task ID:** M3-T05
- **Title:** Create `risk_assessments` table (immutable)
- **Purpose:** Store each risk computation as an immutable record
- **Why it matters:** Risk score is a regulatory decision input; every computation must be traceable
- **Dependencies:** M2 complete
- **Files/Folders affected:** `supabase/migrations/0008_create_risk.sql`
- **DB changes:** `risk_assessments(id, customer_id, tenant_id, score, risk_band, factor_breakdown JSONB, rule_set_version, computed_at, inputs_snapshot JSONB)`
- **API changes:** `POST /api/risk/[customerId]`, `GET /api/risk/[customerId]/latest`
- **UI changes:** Risk score display in case detail
- **Edge Function / webhook / cron impact:** Called after screening completes
- **Security / compliance:** Immutable after creation; re-assessment creates new record; old records preserved
- **Acceptance criteria:**
  - Score computed with correct 3-dimension formula (customer 30%, geo 25%, product 20%)
  - risk_band assigned per thresholds
  - New assessment creates new row — does not overwrite
- **Test checklist:**
  - [ ] Unit: low-risk inputs → LOW band
  - [ ] Unit: PEP=true → HIGH or UNACCEPTABLE band
  - [ ] pgTAP: risk_assessments no UPDATE/DELETE
- **Status:** `todo`

#### Task 3.3.2 — Risk Scoring Implementation (3 Dimensions)
- **Task ID:** M3-T06
- **Title:** Implement 3-dimension risk scoring: customer, geographic, product dimensions
- **Purpose:** Composite risk score drives CDD vs EDD routing
- **Why it matters:** Risk-based approach is the cornerstone of AML compliance; incorrect scoring = regulatory exposure
- **Dependencies:** M3-T05
- **Files/Folders affected:** `modules/risk/risk.service.ts`, `modules/risk/dimensions/customer.dimension.ts`, `modules/risk/dimensions/geographic.dimension.ts`, `modules/risk/dimensions/product.dimension.ts`
- **DB changes:** None
- **API changes:** None
- **UI changes:** None (internal)
- **Edge Function / webhook / cron impact:** Called from workflow engine after screening
- **Security / compliance:**
  - [LEGAL / COMPLIANCE CHECK] FATF high-risk country list must be up-to-date at go-live
  - PEP status must contribute significantly to customer dimension score
  - Default weights: customer 30%, geo 25%, product 20% (per PRD Section 4.3)
- **Acceptance criteria:**
  - Composite score = sum of (dimension_score × weight) across 3 active dimensions
  - Factor breakdown stored in risk_assessment.factor_breakdown JSONB
  - High-risk jurisdiction → geo score ≥ 75
- **Test checklist:**
  - [ ] Unit: UAE resident, non-PEP, low-risk product → score ≤ 30 (LOW)
  - [ ] Unit: Iranian national → score > 60 (HIGH)
  - [ ] Unit: PEP self-declaration = true → score > 60
- **Status:** `todo`

---

### EPIC 3.4 · Case Management

#### Task 3.4.1 — Migrations: cases, case_events, approvals
- **Task ID:** M3-T07
- **Title:** Create case management tables
- **Purpose:** Human review workflow for cases that cannot be auto-approved
- **Why it matters:** Most regulated onboardings require analyst review; this is the compliance workbench
- **Dependencies:** M3-T05
- **Files/Folders affected:** `supabase/migrations/0009_create_cases.sql`, `supabase/migrations/0010_create_approvals.sql`
- **DB changes:**
  ```
  cases(id, tenant_id, customer_id, risk_assessment_id, status, assigned_to, queue_type, created_at, sla_deadline, closed_at)
  case_events(id, case_id, tenant_id, event_type, actor_id, actor_role, occurred_at, notes TEXT, metadata JSONB)
  approvals(id, case_id, tenant_id, stage, approved_by, role, decision, rationale, decided_at, is_override BOOL)
  ```
  case_events and approvals: append-only.
- **API changes:** `GET /api/cases`, `GET /api/cases/[id]`, `POST /api/cases/[id]/events`, `POST /api/approvals/[caseId]`
- **UI changes:** Case queue page, case detail page
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - approvals: immutable after recording; no UPDATE permitted
  - DB CHECK constraint: decision must be by a valid compliance role
  - SAR flag visible only to MLRO role (field-level masking in API response)
- **Acceptance criteria:**
  - High-risk customer → case created automatically after risk scoring
  - Analyst assigns case → case_events row created
  - Approval recorded → immutable
- **Test checklist:**
  - [ ] pgTAP: case_events append-only
  - [ ] pgTAP: approvals append-only
  - [ ] API: non-MLRO cannot read SAR field
- **Status:** `todo`

#### Task 3.4.2 — Analyst Case Queue UI
- **Task ID:** M3-T08
- **Title:** Build case queue UI with role-filtered list, sorting by risk band and SLA
- **Purpose:** Analyst workbench to review and action pending cases
- **Why it matters:** Case queue is the daily operational tool for compliance teams
- **Dependencies:** M3-T07
- **Files/Folders affected:** `app/(platform)/cases/page.tsx`, `components/cases/case-queue.tsx`, `components/cases/case-filters.tsx`
- **DB changes:** None
- **API changes:** `GET /api/cases` with filters
- **UI changes:** Case list with columns: customer name, risk band, assigned to, SLA deadline, status
- **Edge Function / webhook / cron impact:** Supabase Realtime subscription for live updates
- **Security / compliance:** RLS ensures analysts only see their assigned cases; MLRO sees all high-risk
- **Acceptance criteria:**
  - Analyst sees only their assigned cases
  - MLRO sees all cases in their risk-band queue
  - Cases sortable by SLA deadline and risk band
  - New case appears in real-time via Supabase Realtime
- **Test checklist:**
  - [ ] E2E: analyst cannot see another analyst's cases
  - [ ] E2E: new case appears without page refresh (Realtime)
- **Status:** `todo`

#### Task 3.4.3 — Case Detail View + Analyst Actions
- **Task ID:** M3-T09
- **Title:** Build case detail UI: full customer data, documents (signed URL), screening hits, risk score, action buttons
- **Purpose:** Complete case workbench — analyst has all evidence in one view to make a decision
- **Why it matters:** Analyst must see everything in one place to make a defensible compliance decision
- **Dependencies:** M3-T08
- **Files/Folders affected:** `app/(platform)/cases/[caseId]/page.tsx`, `components/cases/case-detail.tsx`, `components/cases/analyst-actions.tsx`
- **DB changes:** Writes to case_events, approvals
- **API changes:** `POST /api/cases/[id]/events`, `POST /api/approvals/[caseId]`
- **UI changes:** Case detail with tabs: Customer Data, Documents, Screening, Risk, Timeline
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:**
  - Document access via signed URL (15-min TTL, generated per request)
  - Analyst note is immutable once submitted
  - RAI (Request Additional Info) sends email to customer via Resend
  - Rejection message must be tipping-off compliant
- **Acceptance criteria:**
  - Analyst can view all data, documents (via signed URL), screening hits, risk score
  - Analyst can: Add Note, Request Additional Info, Escalate, Approve, Reject
  - Each action creates a `case_events` row + `audit_log` event
  - Approval creates an `approvals` row — immutable
- **Test checklist:**
  - [ ] Document signed URL expires after 15 min
  - [ ] Approve → approval row immutable (pgTAP)
  - [ ] RAI → email sent (mock Resend in test)
  - [ ] Audit: all actions appear in audit_log
- **Status:** `todo`

---

## MILESTONE 4 · Admin Config UI and Tenant Workflow Management

> **Objective:** Tenant-facing admin configuration — settings, workflow versions, user management, audit log viewer.

---

### EPIC 4.1 · Tenant Configuration

#### Task 4.1.1 — Migration: tenant_config table (versioned JSONB)
- **Task ID:** M4-T01
- **Title:** Create `tenant_config` table with versioning
- **Purpose:** Store all tenant configuration in versioned, auditable JSONB
- **Why it matters:** Config changes must be traceable; a misconfiguration must be reversible
- **Dependencies:** M1 complete
- **Files/Folders affected:** `supabase/migrations/` (tenant_config), `modules/admin-config/config.service.ts`
- **DB changes:** `tenant_config(id, tenant_id, version, config JSONB, is_current, created_at, created_by, acknowledged_by)`
- **API changes:** `GET /api/admin/config`, `PATCH /api/admin/config`
- **UI changes:** None yet (next task)
- **Edge Function / webhook / cron impact:** All modules read tenant_config at runtime
- **Security / compliance:** Only tenant_admin role can write; all changes create new version + audit event
- **Acceptance criteria:**
  - Config change creates new version row; previous version preserved
  - `is_current` flag updated to point to new version
  - Audit event written on every config change
- **Test checklist:**
  - [ ] pgTAP: old versions preserved after update
  - [ ] API: non-admin cannot PATCH config (403)
  - [ ] Audit: config.changed event present
- **Status:** `todo`

#### Task 4.1.2 — Admin Configuration UI
- **Task ID:** M4-T02
- **Title:** Build tenant admin config UI: module toggles, document type config, approval role selection, branding
- **Purpose:** Tenant Admin can configure their instance without code changes
- **Why it matters:** Operational requirement — tenants need to manage their own settings
- **Dependencies:** M4-T01
- **Files/Folders affected:** `app/(platform)/admin/config/`, `components/admin/`
- **DB changes:** Writes to tenant_config
- **API changes:** `GET/PATCH /api/admin/config`
- **UI changes:** Config sections: Active Modules, Document Requirements, Approval Roles, Branding, Risk Thresholds (read-only in MVP)
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** Workflow activation requires MLRO acknowledgement (checkbox) before proceeding
- **Acceptance criteria:**
  - Tenant Admin changes a setting → saved as new config version
  - Attempting to activate workflow without MLRO acknowledgement → blocked
  - Logo upload → appears in customer-facing UI
- **Test checklist:**
  - [ ] E2E: config change → new version in DB
  - [ ] E2E: workflow activation without MLRO acknowledge → error
- **Status:** `todo`

---

### EPIC 4.2 · Audit Log Viewer

#### Task 4.2.1 — Audit Log Viewer UI (MLRO/Admin)
- **Task ID:** M4-T03
- **Title:** Build audit log viewer: filterable by entity, date range, event type; shows chronological history
- **Purpose:** MLRO and Admin can query and review the complete audit trail
- **Why it matters:** Regulatory audit requirement — MLRO must be able to produce audit trail on demand
- **Dependencies:** M1-T17 (audit service)
- **Files/Folders affected:** `app/(platform)/audit/page.tsx`, `components/audit/audit-log-table.tsx`
- **DB changes:** Reads audit_log only (no writes)
- **API changes:** `GET /api/audit` with filters
- **UI changes:** Table with filters: entity_type, entity_id, date range, event_type, actor_id
- **Edge Function / webhook / cron impact:** None
- **Security / compliance:** Only MLRO and tenant_admin can access audit log; tenant isolation enforced by RLS
- **Acceptance criteria:**
  - Query all events for a customer → complete chronological history
  - Filter by date range → correct results
  - Export as JSON-L → valid structured file
- **Test checklist:**
  - [ ] Analyst cannot access /audit (middleware + RLS)
  - [ ] Export for test customer contains all expected events
- **Status:** `todo`

---

## MILESTONE 5 · Hardening, Error Handling, Pre-Launch Compliance Review

> **Objective:** Production-ready: error handling, PII audit, RLS test suite, load test, MLRO walkthrough.

---

### EPIC 5.1 · Security Hardening

#### Task 5.1.1 — PII Audit: Scan All Log Outputs for Leakage
- **Task ID:** M5-T01
- **Title:** Automated PII scan of all log outputs; implement `sanitise()` utility
- **Why it matters:** DevPlan Section 8.3: PII in logs is a data protection violation
- **Status:** `todo`

#### Task 5.1.2 — RLS Policy Test Suite (pgTAP)
- **Task ID:** M5-T02
- **Title:** Complete pgTAP test suite for all RLS policies — every policy with correct and incorrect tenant contexts
- **Why it matters:** RLS is the primary tenant isolation mechanism; untested RLS = potential data breach
- **Status:** `todo`

#### Task 5.1.3 — Audit Trail Completeness Test
- **Task ID:** M5-T03
- **Title:** Run full onboarding flow and verify every step has a corresponding audit_log event
- **Why it matters:** Compliance requires complete audit trail — gaps = regulatory exposure
- **Status:** `todo`

#### Task 5.1.4 — Signed URL Access Test
- **Task ID:** M5-T04
- **Title:** Verify document access denied without valid session; verify 15-min TTL
- **Status:** `todo`

#### Task 5.1.5 — Error Boundaries and Graceful Failure States
- **Task ID:** M5-T05
- **Title:** Complete error boundary implementation; IDV unavailable → session paused, manual review triggered
- **Status:** `todo`

---

### EPIC 5.2 · Compliance Review

#### Task 5.2.1 — MLRO Walkthrough: Complete High-Risk Case Flow
- **Task ID:** M5-T06
- **Title:** MLRO completes a full high-risk case review; confirms operational usability
- **[LEGAL / COMPLIANCE CHECK]** MLRO sign-off required before go-live
- **Status:** `todo`

#### Task 5.2.2 — 10 Onboarding Scenarios End-to-End
- **Task ID:** M5-T07
- **Title:** Run all 10 scenarios: happy path, IDV fail, screening hit, high-risk, rejection, RAI, PEP, MLRO escalation, auto-approve, unacceptable risk
- **Status:** `todo`

---

## MILESTONE 6 · Production Deployment and Operational Readiness

> **Objective:** Live production environment, first real customer, monitoring active.

---

#### Task 6.1.1 — Production Supabase Project Setup
- **Task ID:** M6-T01
- **Title:** Provision production Supabase project (paid plan, PITR enabled, daily backups confirmed)
- **Status:** `todo`

#### Task 6.1.2 — Production Vercel Deployment
- **Task ID:** M6-T02
- **Title:** Configure production Vercel project, production env vars, domain, SSL
- **[CONFIRM BEFORE BUILD]** Vercel region selection (me-1 or fra1) for UAE data residency
- **Status:** `todo`

#### Task 6.1.3 — Monitoring: Sentry + Vercel Log Drain + Supabase Alerts
- **Task ID:** M6-T03
- **Title:** Set up error tracking (Sentry), log drain, Supabase dashboard alerts
- **Status:** `todo`

#### Task 6.1.4 — pg_cron Jobs Activation
- **Task ID:** M6-T04
- **Title:** Activate pg_cron jobs: document expiry check (daily), failed webhook retry (hourly)
- **Status:** `todo`

#### Task 6.1.5 — Operational Runbook
- **Task ID:** M6-T05
- **Title:** Write operational runbook: investigate failed onboarding, manually retry webhook, generate audit report
- **Status:** `todo`

#### Task 6.1.6 — Backup Restoration Test
- **Task ID:** M6-T06
- **Title:** Confirm Supabase daily backup; perform restoration test
- **Status:** `todo`

---

## PENDING CONFIRMATIONS BEFORE BUILD

| # | Confirmation Needed | Blocks |
|---|---|---|
| C-01 | Vercel region: `fra1` or `me-1`? UAE data residency requirement | M1-T04 |
| C-02 | MFA enforcement: JWT claim check in middleware vs Supabase Auth hook | M1-T09 |
| C-03 | Sumsub selected as IDV provider? API credentials available? | M3-T01 |
| C-04 | ComplyAdvantage selected as screening provider? API credentials? | M3-T04 |
| C-05 | Resend selected as email provider? Domain DNS (SPF/DKIM) setup? | M3-T09 (RAI) |
| C-06 | UAE Executive Office list covered by ComplyAdvantage? | M3-T04 |
| C-07 | Sumsub UAE/GCC data processing satisfies UAE PDPL? Legal confirmation? | M3-T01 |
| C-08 | Application-level PII column encryption key: rotation plan defined? | M2-T05 |
| C-09 | MLRO available for Milestone 5 walkthrough? | M5-T06 |
| C-10 | Shared schema + RLS is acceptable for MVP (not schema-per-tenant)? | M1-T05 |

---

*Master To-Do List v1.0 · Generated from PRD v1.0 + DevPlan v1.0 · TruVis International Services · 2026*
