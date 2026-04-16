# AML/KYC/CDD Portal — Build Order & Dependency Map
> Source of truth: PRD v1.0 + Development Plan v1.0 · TruVis International Services
> Classification: Internal · Confidential · 2026

---

## SECTION 1 · Build Order Principles

1. **Security backbone before data flows** — Auth, RBAC, RLS, and audit_log must be proven before any customer PII is written
2. **Audit immutability before anything** — audit_log table created before onboarding, consent, or KYC tables exist
3. **Consent before PII** — consent capture must be complete before any personal data collection form is built
4. **Async architecture before IDV/screening** — webhook queue must be built before integrating providers whose responses arrive asynchronously
5. **Mock adapters in parallel with integration** — build provider interfaces before integrating real providers
6. **Admin config last in MVP** — config UI is only meaningful after the features being configured are working
7. **No Phase 2 features in MVP** — KYB, UBO, full EDD, multi-stage approvals are explicitly deferred

---

## SECTION 2 · Exact Sequential Build Order

### PHASE 0 — CONFIRMATIONS (Before any coding)

```
[ ] C-01: Confirm Vercel region (fra1 vs me-1) for UAE data residency
[ ] C-02: Confirm MFA enforcement mechanism (middleware vs Supabase hook)
[ ] C-10: Confirm shared schema + RLS is acceptable for MVP
```
> **These three block Milestone 1. All others (C-03 through C-09) block Milestone 3 and later.**

---

### PHASE 1 — MILESTONE 1 (Sequential — no parallelism until T03 onwards)

```
M1-T01  Initialize Next.js 16 project
   ↓
M1-T02  Create folder structure (app/, modules/, lib/, components/, supabase/, tests/)
   ↓
M1-T03  Supabase CLI initialisation + extensions (pgcrypto, pg_cron, uuid-ossp)
   ↓
M1-T04  Vercel project setup (requires C-01 confirmation)

Then these can run in PARALLEL after T03:

M1-T05  Migration 0001: tenants table
M1-T09  Supabase Auth configuration        ← safe to start in parallel

After M1-T05:
M1-T06  Migration 0002: users, user_roles, roles

After M1-T06 and M1-T05:
M1-T07  Migration 0003: audit_log (append-only, hash chain)

After M1-T07:
M1-T08  Migration 0004: Generic audit trigger function
M1-T10  JWT enrichment Edge Function (requires M1-T06 + M1-T09)

After M1-T08 and M1-T10:
M1-T11  RBAC role definitions (modules/auth/rbac.ts)
M1-T12  Auth service / Supabase client setup

After M1-T11 + M1-T12:
M1-T13  Edge Middleware (auth guard, tenant resolution, MFA check)

After M1-T13:
M1-T14  Sign-in, email verification, MFA setup UI

After M1-T14:
M1-T15  User invitation flow
M1-T16  Role-based navigation shell

After M1-T08:
M1-T17  Audit service module (emit, query, export)

⬛ MILESTONE 1 COMPLETE — ACCEPTANCE CRITERIA MET
```

---

### PHASE 2 — MILESTONE 2 (After M1 complete)

```
M2-T01  Migration: consent_records table
   ↓
M2-T02  Consent capture UI + API

M2-T03  Migration: onboarding_sessions, customers, customer_data_versions  ← parallel with M2-T01
   ↓
M2-T04  WorkflowEngine TypeScript class + workflow_definitions migration + default workflow seed

After M2-T02 + M2-T04:
M2-T05  Personal data collection form (M-02 fields, Zod validation)

M2-T06  Migration: documents, document_events + Storage bucket setup  ← parallel with M2-T04
   ↓
M2-T07  Document upload flow (signed URL pattern)
   ↓
M2-T08  Compute-document-hash Edge Function

⬛ MILESTONE 2 COMPLETE — ACCEPTANCE CRITERIA MET
```

---

### PHASE 3 — MILESTONE 3 (After M2 complete — C-03, C-04, C-05, C-06, C-07 must be confirmed)

```
M3-T02  Webhook events queue + retry pg_cron job  ← BUILD FIRST, before any provider integration

Then in PARALLEL:
M3-T01  IDV provider integration (Sumsub)         ← requires C-03, C-07
M3-T03  Migration: screening tables
M3-T05  Migration: risk_assessments table

After M3-T03:
M3-T04  Screening adapter pattern + ComplyAdvantage adapter  ← requires C-04, C-06

After M3-T04 + M3-T05:
M3-T06  Risk scoring implementation (3 dimensions)

After M3-T05 + M3-T06:
M3-T07  Migration: cases, case_events, approvals

After M3-T01 + M3-T06 + M3-T07:
M3-T08  Analyst case queue UI
   ↓
M3-T09  Case detail view + analyst actions (requires C-05 for RAI email)

⬛ MILESTONE 3 COMPLETE — ACCEPTANCE CRITERIA MET
```

---

### PHASE 4 — MILESTONE 4 (After M3 complete)

```
M4-T01  Migration: tenant_config (versioned JSONB)
   ↓
M4-T02  Admin configuration UI

M4-T03  Audit log viewer UI  ← parallel with M4-T01 (uses existing audit_log)

⬛ MILESTONE 4 COMPLETE — ACCEPTANCE CRITERIA MET
```

---

### PHASE 5 — MILESTONE 5 (After M4 complete)

```
M5-T01  PII audit scan (all log outputs)
M5-T02  RLS policy pgTAP test suite (can start earlier — parallel with M3)
M5-T03  Audit trail completeness test
M5-T04  Signed URL access test
M5-T05  Error boundaries and graceful failure states
   ↓
M5-T07  10 onboarding scenarios end-to-end
   ↓
M5-T06  MLRO walkthrough (requires C-09)

⬛ MILESTONE 5 COMPLETE — ACCEPTANCE CRITERIA MET
```

---

### PHASE 6 — MILESTONE 6 (After M5 complete)

```
M6-T01  Production Supabase project (paid plan, PITR)
M6-T02  Production Vercel deployment + domain + SSL
M6-T03  Monitoring setup (Sentry + log drain + alerts)
M6-T04  pg_cron jobs activation
M6-T05  Operational runbook
M6-T06  Backup restoration test

⬛ MILESTONE 6 COMPLETE — PRODUCTION LIVE
```

---

## SECTION 3 · Dependency Map (Visual)

```
[C-01/C-02/C-10 confirmed]
         │
    M1-T01 (Next.js scaffold)
         │
    M1-T02 (Folder structure)
         │
    M1-T03 (Supabase CLI + extensions)
         │
    ┌────┴─────────┐
M1-T04           M1-T05 (tenants)
(Vercel)              │
                 M1-T06 (users/roles)
                      │
                 M1-T07 (audit_log) ←── MOST CRITICAL TABLE
                      │
               ┌──────┴──────┐
          M1-T08           M1-T10
       (audit triggers)  (enrich-jwt)
                      │
               ┌──────┴──────┐
          M1-T11           M1-T12
          (RBAC)         (Supabase clients)
                      │
                   M1-T13
                (Middleware)
                      │
                   M1-T14 (Auth UI)
                      │
              ┌───────┴───────┐
          M1-T15           M1-T16
        (Invite)         (Nav shell)
                      │
         ┌────────────┴────────────┐
    M2-T01 (consent)        M2-T03 (sessions/customers)
         │                        │
    M2-T02 (consent UI)      M2-T04 (WorkflowEngine)
         │                        │
         └────────┬───────────────┘
              M2-T05 (KYC form)
              M2-T06 (documents)
                  │
              M2-T07 (upload flow)
              M2-T08 (hash Edge Fn)
                  │
         [C-03/C-04/C-05/C-06/C-07 confirmed]
                  │
              M3-T02 (webhook queue) ←── BUILD BEFORE PROVIDERS
                  │
         ┌────────┴──────────┐
    M3-T01 (IDV/Sumsub)  M3-T03 (screening tables)
                              │
                          M3-T04 (screening adapter)
                          M3-T05 (risk_assessments)
                              │
                          M3-T06 (risk scoring 3D)
                              │
                          M3-T07 (cases/approvals)
                              │
                          M3-T08 (case queue UI)
                              │
                          M3-T09 (case detail + actions)
                              │
                          M4-T01 (tenant_config)
                          M4-T02 (admin config UI)
                          M4-T03 (audit log viewer)
                              │
                          M5 (hardening + testing)
                              │
                          M6 (production deployment)
```

---

## SECTION 4 · What Must NOT Be Started Before Previous Items Complete

| Item | Must NOT start until... |
|---|---|
| Any table with `tenant_id` | M1-T05 (tenants table) is migrated |
| Auth UI | M1-T09 (Supabase Auth configured) + M1-T12 (clients) |
| Consent form UI | M2-T01 (consent_records table) + M2-T04 (WorkflowEngine) |
| KYC form | M2-T02 (consent capture working) |
| Document upload | M2-T06 (documents table + Storage bucket) |
| IDV integration | M3-T02 (webhook queue) — must not call IDV without a queue |
| Screening integration | M3-T02 (webhook queue) AND M3-T03 (tables) |
| Risk scoring | M3-T01 AND M3-T03 (need IDV and screening results as inputs) |
| Cases | M3-T05 + M3-T06 (risk score feeds case creation trigger) |
| Admin config UI | M3 complete (configuring features before they exist is meaningless) |
| Production deployment | M5 acceptance criteria all met (especially MLRO walkthrough) |

---

## SECTION 5 · Items That Can Be Parallelised

| Parallel Group | Items | Condition |
|---|---|---|
| A | M1-T04 (Vercel) + M1-T05 (tenants table) | After M1-T03 |
| B | M1-T09 (Auth config) + M1-T05 (tenants table) | After M1-T03 |
| C | M1-T11 (RBAC) + M1-T12 (clients) | After M1-T08 + M1-T10 |
| D | M1-T15 (invite) + M1-T16 (nav shell) | After M1-T14 |
| E | M2-T01 (consent table) + M2-T03 (session/customer tables) | After M1 complete |
| F | M2-T06 (docs table) + M2-T04 (WorkflowEngine) | After M2-T03 |
| G | M3-T01 (IDV) + M3-T03 (screening tables) + M3-T05 (risk tables) | After M3-T02 |
| H | M4-T02 (admin UI) + M4-T03 (audit viewer) | After M4-T01 |
| I | M5-T01 through M5-T05 (hardening tasks) | After M4 complete |
| J | M6-T01 through M6-T06 (production setup) | After M5 complete |

---

## SECTION 6 · Explicitly Deferred (NOT in MVP)

| Item | Phase | Why Deferred |
|---|---|---|
| Corporate KYB (M-03) | Phase 2 | Complex module; requires proven Individual KYC first |
| UBO Recursive Resolution (M-04) | Phase 2 | Depends on M-03; complex algorithm |
| Full EDD Form (M-06) | Phase 2 | High-risk routing works in MVP; separate EDD form content is Phase 2 |
| Multi-stage parallel approval (M-11) | Phase 2 | Single-stage sufficient for MVP compliance baseline |
| Adverse media screening | Phase 2 | Sanctions + PEP sufficient for MVP AML obligation |
| Custom watchlists (M-07) | Phase 2 | Standard lists sufficient for initial deployment |
| Ongoing monitoring / periodic re-KYC (M-14) | Phase 2 | Post-approval monitoring only needed after first cohort onboarded |
| Full workflow visual builder (M-15) | Phase 3 | JSON-defined workflows in MVP; UI builder deferred |
| Multi-language UI (Arabic) | Phase 2 | English-only for MVP |
| Video KYC | Phase 3 | Regulatory pre-approval required |
| goAML / SAR filing integration | Phase 2 | MLRO handles manually in MVP |
| Multi-tenant schema isolation | Phase 2 | Shared schema + RLS sufficient for MVP |
| ML-assisted risk calibration | Phase 3 | Requires production data volume |
| Mobile SDK | Phase 3 | Web-first MVP |
| Data subject rights automation | Phase 3 | Manual process documented; automation deferred |
| Blockchain/VASP screening | Phase 3 | Crypto vertical not in MVP |
| Registry API integrations (ADGM, DIFC) | Phase 2 | API access confirmation required |
| Financial transaction monitoring | Phase 3+ | Separate system |

---

## SECTION 7 · Blockers (Items That Stop Build Progress)

| Blocker | Affects | Resolution Path |
|---|---|---|
| Supabase project not created | Everything | Create project on supabase.com; get connection string + service role key |
| Vercel project not connected to repo | M1-T04 | Connect via Vercel dashboard + GitHub integration |
| MFA enforcement approach not confirmed | M1-T09 | Review Supabase Auth Hooks documentation; choose middleware or hook approach |
| IDV provider credentials not available | M3-T01 | Create Sumsub account; get API credentials + webhook signing secret |
| Screening provider credentials not available | M3-T04 | Create ComplyAdvantage account; get API key + webhook secret |
| Email provider (Resend) domain not configured | M3-T09 | Configure SPF/DKIM/DMARC on sending domain in Resend |
| MLRO not appointed | M5-T06 | MLRO appointment is an organisational decision; cannot be bypassed |
| Production Supabase not on paid plan | M6-T01 | Upgrade to Pro plan for PITR and daily backups |

---

## SECTION 8 · Items Requiring Confirmation Before Coding

> All items tagged `[CONFIRM BEFORE BUILD]` in the Todo list. Reference Section 2 of Todo.

Critical path confirmations (block Milestone 1):
- **C-01** Vercel region
- **C-02** MFA enforcement mechanism
- **C-10** Shared schema vs schema-per-tenant

Must be confirmed before Milestone 3:
- **C-03** Sumsub selected + credentials
- **C-04** ComplyAdvantage selected + credentials
- **C-05** Resend selected + domain DNS
- **C-06** UAE Executive Office list coverage
- **C-07** Sumsub UAE PDPL compliance confirmation

Before go-live:
- **C-08** PII column encryption key rotation plan
- **C-09** MLRO available for walkthrough

---

*Build Order v1.0 · Generated from PRD v1.0 + DevPlan v1.0 · TruVis International Services · 2026*
