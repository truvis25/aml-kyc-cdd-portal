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
| Edge Functions | Supabase Edge Functions (Deno) |
| File Storage | Supabase Storage (private buckets, signed URLs) |
| Deployment | Vercel (App Router) |

## Repository

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
supabase functions deploy enrich-jwt
```

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

## Milestone Status

- **Milestone 1 (Foundation):** In Progress
- **Milestone 2 (Onboarding):** Not started
- **Milestone 3 (IDV/Screening/Risk/Cases):** Not started
- **Milestone 4 (Admin Config):** Not started
- **Milestone 5 (Hardening):** Not started
- **Milestone 6 (Production):** Not started

See `docs/MILESTONE_CHECKLISTS.md` for detailed acceptance criteria per milestone.
