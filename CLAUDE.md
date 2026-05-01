# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository is the **AML/KYC/CDD Portal** — a compliance portal for Anti-Money Laundering (AML), Know Your Customer (KYC), and Customer Due Diligence (CDD) workflows.

Source documents: `KYC AML Onboarding PRD v1.docx` and `KYC AML Development Plan v1.docx`.
Planning docs: see `docs/` folder.

## Tech Stack (Milestone 1 — established)

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router), TypeScript strict |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives (shadcn/ui pattern) |
| Schema validation | Zod v4 |
| Database | Supabase Postgres (shared schema + RLS) |
| Auth | Supabase Auth (email+password + TOTP MFA) |
| JWT Enrichment | Postgres Custom Access Token Hook (`custom_access_token_hook`) |
| Edge Functions | Supabase Edge Functions (Deno) — for future async tasks |
| File Storage | Supabase Storage (private buckets, signed URLs) |
| Deployment | Vercel (App Router) — region `me1` (Bahrain) |

## Confirmed Architecture Decisions

| Decision | Value |
|---|---|
| **C-01** Vercel region | `me1` (Bahrain) — UAE data residency baseline |
| **C-02** JWT enrichment method | Postgres Custom Access Token Hook (`custom_access_token_hook` in migration 0005) |
| **C-10** Multi-tenancy model | Shared schema + `tenant_id` on all tenant-scoped tables + strict RLS (schema-per-tenant deferred) |

> **C-02 registration:** After applying migration 0005, enable the hook in:
> Supabase Dashboard → Authentication → Hooks → Custom Access Token Hook → select `custom_access_token_hook`

- Remote: `truvis25/aml-kyc-cdd-portal`
- Feature branches should be pushed to `origin` and PRs opened against `main`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Start local Supabase (requires Supabase CLI)
supabase start

# Reset local database (re-runs all migrations + seed)
supabase db reset

# Run pgTAP database tests
supabase test db

# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# Deploy Edge Functions to Supabase
# NOTE: enrich-jwt Edge Function is RETIRED — JWT enrichment is now a Postgres hook (C-02)
supabase functions deploy process-screening-webhook
supabase functions deploy process-idv-webhook
supabase functions deploy retry-failed-webhooks
supabase functions deploy compute-document-hash
```

## Notifications (Resend)

Outbound transactional email is delivered via [Resend](https://resend.com). Set
`RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, and optionally `RESEND_REPLY_TO` in
`.env.local` and Vercel env. When `RESEND_API_KEY` is unset, send calls are a
no-op and a `notification_events` row with `status='failed'` /
`error='not_configured'` is recorded — case actions still succeed.

Templates live in `modules/notifications/templates/`. The public surface
(`modules/notifications/index.ts`) exposes `sendRaiEmail`, `sendApprovalEmail`,
and `sendRejectionEmail`. All sends are logged to `notification_events` (RLS,
append-only) and emit a corresponding `audit_log` event.

## Post-Deploy: Webhook Retry Schedule (one-time per environment)

After Edge Functions are deployed and migration 0028 is applied, register the
hourly pg_cron schedule that drives webhook retries. This is one-time per
environment because the URL and JWT are env-specific:

```sql
SELECT cron.schedule(
  'retry-failed-webhooks-hourly',
  '0 * * * *',
  $$ SELECT net.http_post(
       url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/retry-failed-webhooks',
       headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>')
     ) $$
);
```

Verify by querying `cron.job` and watching `webhook_events.status` transitions
after deliberately failing a test event.

## Environment Setup

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase dashboard
# Add SUPABASE_SERVICE_ROLE_KEY (server-only -- never expose to browser)
```

## Folder Structure

```
app/                    Next.js App Router pages + API routes
  (auth)/               Sign-in, MFA setup (public routes)
  (platform)/           Authenticated platform pages
  (onboarding)/         Customer-facing onboarding flow
  api/                  API route handlers (thin layer -- delegate to modules/)
modules/                Business logic modules (domain-driven)
  audit/                Audit service (emit, query, export)
  auth/                 RBAC, auth service, JWT types
  onboarding/           Workflow engine, session management
  kyc-individual/       Individual KYC service
  documents/            Document management, signed URLs
  screening/            Screening adapter pattern + providers
  risk/                 3-dimension risk scoring engine
  cases/                Case management service
  approvals/            Approval workflow service
  consent/              Consent capture service
  notifications/        Email/SMS notification adapters
  admin-config/         Tenant configuration service
lib/                    Shared utilities
  supabase/             Supabase clients (client.ts, server.ts, admin.ts)
  constants/            Enums: roles, events, risk bands
  validations/          Zod schemas
  utils.ts              cn() utility (clsx + tailwind-merge)
components/             React components
  ui/                   Base UI primitives (Button, Input, Label)
  shared/               Layout: Sidebar, PlatformShell
  admin/                Admin UI components
  cases/                Case management components
  onboarding/           Customer onboarding components
supabase/               Supabase configuration
  migrations/           Database migrations (sequential, numbered)
  functions/            Edge Functions (Deno)
  seed/                 Seed data for local development
tests/
  unit/                 Vitest unit tests
  integration/          Integration tests
  e2e/                  End-to-end tests
  db/                   pgTAP database tests
```

## Critical Architecture Rules

1. **`lib/supabase/admin.ts` (service role client) must NEVER be imported in `app/`** -- only in `supabase/functions/`
2. **Every table must have RLS enabled** -- no exceptions
3. **audit_log is append-only** -- no UPDATE or DELETE ever (enforced by trigger)
4. **All audit writes must succeed** -- if `audit.emit()` fails, the calling transaction must roll back
5. **No PII in logs** -- use `customer_id`, `session_id`, `case_id` in logs; never names, DOBs, IDs
6. **No signed URL caching** -- generate fresh 15-min signed URL per request
7. **RBAC checks at two layers** -- middleware (JWT claims) AND API route (assertPermission)
8. **customer_data_versions is append-only** -- never bare UPDATE on customer data fields
9. **Webhook queue before provider calls** -- all async webhooks go through `webhook_events` queue
10. **JWT enrichment is a Postgres hook (C-02)** -- `custom_access_token_hook` in migration 0005; the `enrich-jwt` Edge Function is retired and must NOT be deployed

## Project Plan & Status

The canonical project plan is `docs/FINAL_LAUNCH_PLAN.md` — sprint structure, decisions log, gap analysis, test scenario matrix, and pre-launch checklist all live there.

`docs/MILESTONE_CHECKLISTS.md` is preserved as the historical acceptance-criteria reference for Milestones 1–4 (all complete). Milestones 5 and 6 are tracked as Sprints 2 and 3 in FINAL_LAUNCH_PLAN.md.

`docs/ROLES_DASHBOARDS_FLOWS.md` is the policy doc for roles, navigation, dashboards, case flow, RAI, SAR, and the customer journey.

When working on the codebase, default to `FINAL_LAUNCH_PLAN.md` for "what to do next."
