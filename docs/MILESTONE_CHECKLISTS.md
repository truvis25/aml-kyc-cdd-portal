# AML/KYC/CDD Portal — Milestone Checklists
> Source of truth: PRD v1.0 + Development Plan v1.0 · TruVis International Services
> Classification: Internal · Confidential · 2026

---

## MILESTONE 1 — Foundation: Auth, RBAC, Audit, Tenant Setup

### 1. Milestone Objective
Establish the security and compliance backbone before any customer data flows. Authentication, role-based access control, Row Level Security, and the immutable audit trail must be proven before any onboarding code is written.

### 2. Milestone Scope
- Next.js 14 App Router project scaffold (Tailwind, shadcn/ui, TypeScript, Zod)
- Supabase CLI project initialisation with extensions (pgcrypto, pg_cron, uuid-ossp)
- Vercel production + staging deployment environments
- Database migrations: `tenants`, `users`, `user_roles`, `roles`, `audit_log`
- Append-only enforcement on `audit_log` (trigger + permission grant)
- Generic audit trigger function (`log_audit_event()`) attached to core tables
- Supabase Auth: email+password, email verification, TOTP MFA
- JWT enrichment Edge Function: adds `tenant_id`, `role`, `mfa_verified` claims
- RBAC role definitions and permission map in `modules/auth/rbac.ts`
- Supabase client setup: browser, server, admin clients
- Edge Middleware: auth guard, tenant resolution, MFA enforcement
- Sign-in UI, email verification, MFA setup flow
- User invitation flow (Admin invites → user activates → role assigned)
- Role-based navigation shell (authenticated platform layout)
- Audit service module (`emit()`, `query()`, `export()`)

**Out of scope:** Onboarding, KYC, documents, screening, risk scoring, case management — all Phase 2+

### 3. Milestone Task List
| Task ID | Title | Status |
|---|---|---|
| M1-T01 | Initialize Next.js 14 App Router project | `todo` |
| M1-T02 | Create canonical folder structure | `todo` |
| M1-T03 | Supabase CLI initialisation + extensions | `todo` |
| M1-T04 | Vercel project setup + environments | `todo` |
| M1-T05 | Migration 0001: tenants table | `todo` |
| M1-T06 | Migration 0002: users, user_roles, roles | `todo` |
| M1-T07 | Migration 0003: audit_log (append-only, hash chain) | `todo` |
| M1-T08 | Migration 0004: generic audit trigger function | `todo` |
| M1-T09 | Supabase Auth configuration (email, MFA) | `todo` |
| M1-T10 | JWT enrichment Edge Function (enrich-jwt) | `todo` |
| M1-T11 | RBAC role definitions + permission map | `todo` |
| M1-T12 | Auth service / Supabase client setup (browser, server, admin) | `todo` |
| M1-T13 | Edge Middleware: auth guard, tenant resolution, MFA check | `todo` |
| M1-T14 | Sign-in, email verification, MFA setup UI | `todo` |
| M1-T15 | User invitation flow | `todo` |
| M1-T16 | Role-based navigation shell | `todo` |
| M1-T17 | Audit service module (emit, query, export) | `todo` |

### 4. Milestone Checklist
- [ ] Next.js project builds without TypeScript errors (`npm run build`)
- [ ] All folder structure matches DevPlan Section 10 exactly
- [ ] `supabase start` runs locally and all migrations apply cleanly
- [ ] `supabase db reset` runs without errors
- [ ] pgcrypto, pg_cron, uuid-ossp extensions enabled
- [ ] Vercel staging deployment live from repo
- [ ] tenants table created with RLS enabled
- [ ] users + user_roles + roles tables created with RLS and seed data
- [ ] audit_log table: UPDATE blocked by trigger, DELETE blocked by trigger
- [ ] audit_log: INSERT succeeds with correct row_hash populated
- [ ] prev_hash references previous row correctly (hash chain)
- [ ] Generic audit trigger fires on tenants INSERT and user_roles INSERT
- [ ] JWT contains tenant_id, role, mfa_verified after sign-in
- [ ] RBAC: all 7 roles defined with correct permission maps
- [ ] Admin client (service role) only importable in Edge Functions — not in app/
- [ ] Unauthenticated user → redirected to /sign-in by middleware
- [ ] Analyst accessing /admin → 403 by middleware
- [ ] Cross-tenant JWT → 403 by middleware
- [ ] MLRO without MFA → redirected to /mfa-setup
- [ ] Sign-in flow works end-to-end
- [ ] MFA TOTP setup flow works for Tenant Admin
- [ ] User invitation: Admin invites → email sent → user activates → correct role
- [ ] Nav shell renders correct items per role (Analyst vs MLRO vs Admin)

### 5. Milestone Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| JWT enrichment hook complexity (Supabase hook type selection) | Medium | High | Prototype hook first before any RLS-dependent feature |
| RLS policy errors causing cross-tenant data exposure | Low | Critical | pgTAP test suite for every policy; test with wrong tenant context |
| MFA enforcement gaps for specific routes | Medium | High | Test every sensitive route with user who has no MFA |
| Vercel region misconfiguration for data residency | Low | High | Confirm region before project creation (C-01) |
| Supabase CLI migration conflicts in team environment | Medium | Medium | Strict migration naming convention (numbered, sequential) |

### 6. Milestone Blockers
- Supabase project not created (supabase.com) → blocks M1-T03
- Vercel project not connected to repo → blocks M1-T04
- Vercel region not confirmed (C-01) → blocks M1-T04
- MFA enforcement approach not confirmed (C-02) → blocks M1-T09 + M1-T10

### 7. Milestone Acceptance Checklist
- [ ] Sign in as Tenant Admin → see dashboard, not another tenant's data
- [ ] Sign in as Analyst → cannot access `/admin/config` (middleware blocks)
- [ ] Write a test audit event → cannot UPDATE or DELETE it (Postgres exception)
- [ ] Invite a new user → receives email → sets password → logs in with correct role
- [ ] MFA required for Tenant Admin on second login
- [ ] All RLS policies have at least one pgTAP test (correct tenant + wrong tenant)
- [ ] `row_hash` is populated and matches SHA-256 of key fields
- [ ] JWT decoded after sign-in contains `tenant_id`, `role`, `mfa_verified`

### 8. Milestone Handoff Checklist (Before Starting Milestone 2)
- [ ] All M1 acceptance criteria met and documented
- [ ] Supabase migrations applied to both local and staging Supabase instances
- [ ] Staging Vercel deployment accessible and auth flow works
- [ ] pgTAP test results documented (all pass)
- [ ] Auth hook reliability tested: simulate failure → re-auth triggered
- [ ] `.env.example` updated with all M1 environment variables
- [ ] CLAUDE.md updated with stack decisions and dev commands
- [ ] Confirm C-03, C-04, C-05 (provider credentials) before starting M3 tasks in M2 planning
- [ ] No debug/console.log statements with PII in any committed code

---

## MILESTONE 2 — Consent, Onboarding Session, Individual KYC Form

### 1. Milestone Objective
Implement the customer-facing onboarding journey for individual customers: consent capture, personal data collection, document upload. End of M2: a customer can complete consent → personal data → document upload with all data persisted correctly.

### 2. Milestone Scope
- `consent_records` table (append-only) + consent capture UI + API
- `onboarding_sessions`, `customers`, `customer_data_versions` tables
- `WorkflowEngine` TypeScript class + default individual KYC workflow definition
- Session initiation API + step submission API
- Personal data collection form (all PRD Section 4.1.1 required fields + Zod validation)
- Document upload: signed URL pattern, direct-to-Storage, metadata record
- `documents`, `document_events` tables + Storage bucket (private, per-tenant, RLS)
- `compute-document-hash` Edge Function (Storage trigger)
- Customer-facing onboarding UI (multi-step form shell, progress indicator)
- Session resumability

**Out of scope:** IDV verification, screening, risk scoring, case management — all Milestone 3

### 3. Milestone Task List
| Task ID | Title | Status |
|---|---|---|
| M2-T01 | Migration: consent_records table | `todo` |
| M2-T02 | Consent capture UI + API | `todo` |
| M2-T03 | Migrations: onboarding_sessions, customers, customer_data_versions | `todo` |
| M2-T04 | WorkflowEngine class + workflow_definitions migration + seed | `todo` |
| M2-T05 | Personal data collection form (M-02 fields, Zod) | `todo` |
| M2-T06 | Migration: documents, document_events + Storage bucket | `todo` |
| M2-T07 | Document upload flow (signed URL) | `todo` |
| M2-T08 | compute-document-hash Edge Function | `todo` |

### 4. Milestone Checklist
- [ ] consent_records: INSERT succeeds; UPDATE raises exception; DELETE raises exception
- [ ] Consent capture: form displayed correctly with purpose checkboxes
- [ ] Consent captured → consent_records row created with correct purpose_codes
- [ ] Consent refusal → onboarding blocked, no personal data collected
- [ ] onboarding_sessions: session created with tenant_id and customer linkage
- [ ] Session resumable: interrupt at step 2 → return → resume at step 2
- [ ] WorkflowEngine: advance() correctly transitions between steps
- [ ] WorkflowEngine: evaluateBranch() correctly evaluates condition strings
- [ ] WorkflowEngine: default individual KYC workflow loaded from DB
- [ ] KYC form: all Required fields (PRD 4.1.1) present and validated
- [ ] KYC form: submission creates customer_data_versions rows (not raw customer update)
- [ ] PEP self-declaration = true → flagged on customer record
- [ ] Storage bucket: private (no public access), per-tenant, RLS applied
- [ ] Document upload: signed URL generated; browser uploads direct to Storage
- [ ] Document upload: documents row created with pending_hash status
- [ ] Document hash: file_hash populated within 10s of upload
- [ ] All session/customer/document events written to audit_log

### 5. Milestone Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| WorkflowEngine branch evaluation edge cases | Medium | High | Comprehensive unit tests covering all branch types |
| Supabase Storage RLS misconfiguration (cross-tenant access) | Low | Critical | Test wrong-tenant access to Storage object → 403 |
| Consent text not legally reviewed before production | Medium | High | [LEGAL CHECK] flag on consent form; do not deploy to production without review |
| Document hash race condition (Storage trigger timing) | Low | Medium | Webhook queue pattern; hash_computed status checked before proceeding |

### 6. Milestone Blockers
- Milestone 1 acceptance criteria not met → blocks all of M2
- IDV provider credentials (C-03) not yet needed for M2 but must be confirmed before M3 starts

### 7. Milestone Acceptance Checklist
- [ ] Submit consent → consent_records row created, immutable (UPDATE blocked)
- [ ] Complete personal data form → customer_data_versions row with all required fields
- [ ] Upload a passport → file in Storage, documents row created, file_hash populated
- [ ] Interrupt session and return → session resumes at correct step
- [ ] DELETE consent_record → Postgres error (permission denied)
- [ ] All audit_log events present for each action above (manually verified)

### 8. Milestone Handoff Checklist (Before Starting Milestone 3)
- [ ] All M2 acceptance criteria met
- [ ] WorkflowEngine unit tests all passing
- [ ] Consent form legal review flag added as [LEGAL CHECK] comment in code + docs
- [ ] Sumsub account created and API credentials available (C-03)
- [ ] ComplyAdvantage account created and API credentials available (C-04)
- [ ] Resend account created, domain DNS (SPF/DKIM/DMARC) configured (C-05)
- [ ] UAE Executive Office list coverage confirmed with ComplyAdvantage (C-06)
- [ ] Sumsub UAE PDPL confirmation obtained from legal (C-07)
- [ ] Storage RLS tested with cross-tenant access attempt (blocked)
- [ ] No PII in any log output during M2 flow execution

---

## MILESTONE 3 — IDV, Screening, Risk Scoring, Case Management

### 1. Milestone Objective
Implement the automated compliance checks — IDV verification, sanctions/PEP screening, risk scoring — and the analyst review queue for cases requiring human decision. End of M3: a complete onboarding flow from consent to analyst approval is working end-to-end.

### 2. Milestone Scope
- `webhook_events` queue table + reliable async processing infrastructure
- IDV provider integration (Sumsub): initiate → webhook → `kyc_results` (immutable)
- `kyc_results` table (immutable after creation)
- Screening provider integration (ComplyAdvantage): submit → webhook → `screening_hits`
- `screening_jobs`, `screening_hits`, `screening_hit_resolutions` tables (all append-only)
- Screening adapter interface + ComplyAdvantage adapter + MockScreeningAdapter
- `risk_assessments` table (immutable) + 3-dimension risk scoring implementation
- Risk band routing in WorkflowEngine (LOW → auto-approve; MEDIUM+ → case)
- `cases`, `case_events`, `approvals` tables
- Analyst case queue UI (role-filtered, real-time updates)
- Case detail view: customer data, documents (signed URL), screening hits, risk score
- Analyst actions: Add Note, Request Additional Information (RAI), Escalate, Approve, Reject
- RAI notification via Resend email
- MLRO review queue (filtered for high-risk)
- Single-stage approval record

**Out of scope:** EDD full form content, multi-stage approval, corporate KYB

### 3. Milestone Task List
| Task ID | Title | Status |
|---|---|---|
| M3-T01 | IDV integration (Sumsub) + process-idv-webhook Edge Function | `todo` |
| M3-T02 | Webhook events queue + retry pg_cron job | `todo` |
| M3-T03 | Migrations: screening_jobs, screening_hits, screening_hit_resolutions | `todo` |
| M3-T04 | Screening adapter pattern + ComplyAdvantage + MockScreeningAdapter | `todo` |
| M3-T05 | Migration: risk_assessments table | `todo` |
| M3-T06 | Risk scoring implementation (3 dimensions: customer, geo, product) | `todo` |
| M3-T07 | Migrations: cases, case_events, approvals | `todo` |
| M3-T08 | Analyst case queue UI (Realtime) | `todo` |
| M3-T09 | Case detail view + analyst actions (RAI via Resend) | `todo` |

### 4. Milestone Checklist
- [ ] Webhook events queue: webhook received → queued → processed → status=processed
- [ ] Failed webhook → retried by pg_cron after 1 hour
- [ ] IDV: Sumsub initiated → webhook received → kyc_results row created
- [ ] kyc_results: immutable (no UPDATE, no DELETE)
- [ ] Liveness pass/fail stored correctly
- [ ] Biometric match score stored correctly
- [ ] Duplicate webhook idempotently handled (no duplicate rows)
- [ ] Screening: ComplyAdvantage job submitted → webhook → screening_hits created
- [ ] Screening hits: analyst resolves → resolution in screening_hit_resolutions (immutable)
- [ ] screening_hit_resolutions: append-only
- [ ] MockScreeningAdapter works in test environment
- [ ] Risk score computed: 3 dimensions, correct weights, correct band assignment
- [ ] Risk score: re-assessment creates new row (original preserved)
- [ ] WorkflowEngine: LOW band → auto-approve; MEDIUM/HIGH/UNACCEPTABLE → case created
- [ ] Cases: created after risk scoring for non-auto-approve
- [ ] case_events: append-only
- [ ] approvals: append-only, immutable after recording
- [ ] Case queue: Analyst sees only assigned cases; MLRO sees high-risk queue
- [ ] Case queue: real-time update when new case assigned (Supabase Realtime)
- [ ] Case detail: all data tabs visible (Customer, Documents, Screening, Risk, Timeline)
- [ ] Document access in case: signed URL with 15-min TTL; wrong tenant → 403
- [ ] Analyst approve → approval row created, immutable
- [ ] RAI action → email sent to customer via Resend
- [ ] MLRO log in → sees correct filtered queue
- [ ] All actions in audit_log with actor_id, role, timestamp

### 5. Milestone Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| IDV webhook delivery failure | Low | High | webhook_events queue + pg_cron retry |
| ComplyAdvantage UAE Executive Office list gap | Medium | High | Confirm before integrating (C-06) |
| Sumsub PDPL compliance not confirmed | Medium | High | Legal confirmation required before production use (C-07) |
| Risk scoring calibration errors | Medium | Medium | Unit tests for all known risk factor combinations; MLRO review of scoring |
| Realtime subscription RLS not enforced | Low | High | Test Realtime subscription with wrong-tenant context |

### 6. Milestone Blockers
- Milestone 2 acceptance criteria not met
- Sumsub credentials not available (C-03)
- ComplyAdvantage credentials not available (C-04)
- Resend domain DNS not configured (C-05)
- UAE Executive Office list not confirmed (C-06)

### 7. Milestone Acceptance Checklist
- [ ] Submit a test onboarding → IDV webhook received → kyc_results populated
- [ ] Run screening on test customer → hits returned → analyst resolves → immutable
- [ ] Risk score computed → correct band → case created for non-auto-approve
- [ ] Analyst approves case → approval record written, immutable
- [ ] MLRO logs in → sees only high-risk cases in queue
- [ ] Failed webhook (simulated) → retried by pg_cron → processed
- [ ] All approvals visible in audit log with actor_id, role, timestamp

### 8. Milestone Handoff Checklist (Before Starting Milestone 4)
- [ ] Complete end-to-end flow working: consent → data → docs → IDV → screening → risk → case → decision
- [ ] No PII in any log output across the complete flow
- [ ] Webhook retry tested and documented
- [ ] SAR field masking verified: non-MLRO cannot see SAR status
- [ ] All async jobs idempotent (duplicate webhook = no duplicate DB rows)
- [ ] MockScreeningAdapter available for test environment
- [ ] Supabase Realtime subscription tested with correct + wrong-tenant contexts

---

## MILESTONE 4 — Admin Config UI and Tenant Workflow Management

### 1. Milestone Objective
Implement the tenant-facing admin configuration interface so tenants can manage settings, workflows, users, and view audit logs without developer intervention.

### 2. Milestone Scope
- `tenant_config` table (versioned JSONB) + admin config read/write API
- Tenant Admin UI: module toggles, document type config, approval role selection, branding
- Workflow definitions management: view current version, history, activate/deactivate (with MLRO acknowledgement)
- User management UI: invite, assign role, deactivate (extends M1 user invite)
- Notification template editor (safe fields only)
- Branding settings: logo upload, company name
- Risk band threshold display (read-only in MVP)
- Audit log viewer (MLRO/Admin): filterable by entity, date range, event type
- Tenant onboarding checklist (setup steps required before first customer)

**Out of scope:** Full drag-and-drop workflow builder (Phase 3), risk weight editing (Phase 2)

### 3. Milestone Task List
| Task ID | Title | Status |
|---|---|---|
| M4-T01 | Migration: tenant_config (versioned JSONB) | `todo` |
| M4-T02 | Admin configuration UI | `todo` |
| M4-T03 | Audit log viewer UI (MLRO/Admin) | `todo` |

### 4. Milestone Checklist
- [ ] tenant_config: config change creates new version row; previous version preserved
- [ ] tenant_config: only tenant_admin can write (403 for other roles)
- [ ] Config change: audit event written
- [ ] Workflow activation: MLRO acknowledgement checkbox required; skipping → blocked
- [ ] Workflow activation: acknowledgement creates audit event
- [ ] Admin UI: all configurable items visible and functional
- [ ] Branding: logo uploaded → appears in customer-facing onboarding UI
- [ ] Audit log viewer: query for customer → complete chronological history
- [ ] Audit log viewer: date range filter works
- [ ] Audit log viewer: export as JSON-L produces valid file
- [ ] Analyst cannot access /audit (middleware + RLS)

### 5. Milestone Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Workflow activation without MLRO acknowledge is possible via API bypass | Low | High | Enforce MLRO acknowledge check server-side in API route, not only in UI |
| Config change breaks running onboarding sessions | Low | Medium | Config version locked to session at session creation; new config applies to new sessions only |

### 6. Milestone Blockers
- Milestones 1–3 acceptance criteria not met
- At least one complete end-to-end onboarding must have been run (to validate the config being managed)

### 7. Milestone Acceptance Checklist
- [ ] Tenant Admin changes document requirements → new workflow_definitions version created; previous version preserved
- [ ] Tenant Admin activates workflow without MLRO acknowledgement → blocked (server-side)
- [ ] MLRO acknowledges → activation proceeds → audit event written
- [ ] Audit log viewer: query events for specific customer → complete history
- [ ] Branding: logo change → customer-facing UI updated

### 8. Milestone Handoff Checklist (Before Starting Milestone 5)
- [ ] All M4 acceptance criteria met
- [ ] MLRO has been briefed on admin config capabilities
- [ ] Tenant onboarding checklist reviewed with first pilot tenant
- [ ] Audit log viewer tested with realistic data volume

---

## MILESTONE 5 — Hardening, Error Handling, Pre-Launch Compliance Review

### 1. Milestone Objective
Harden the MVP for production: complete error handling, automated PII scan, full RLS test suite, MLRO walkthrough of complete high-risk flow, and production security review.

### 2. Milestone Scope
- Complete error boundary implementation across all UI
- Retry logic for all external API calls (IDV, screening, email)
- Graceful failure states: IDV unavailable → session paused, manual review triggered
- PII audit: automated scan of all log outputs for PII leakage
- Zod validation schemas reviewed against PRD required fields
- RLS policy pgTAP test suite: every policy, correct + wrong tenant contexts
- Audit trail completeness test: every step of full flow has audit event
- Signed URL access test: no access without valid session
- Load test: 50 concurrent onboarding sessions
- Supabase connection pooling (PgBouncer mode) configured
- Security review: no secrets in code, no PII in logs, no public Storage URLs
- Data retention: soft-delete pattern verified
- MLRO walkthrough: complete high-risk case review

**10 onboarding scenarios required:**
1. Happy path (auto-approve, low risk)
2. IDV fail → manual review
3. Screening hit (false positive → resolved → approved)
4. Screening hit (true match → MLRO escalation)
5. High-risk customer → EDD flag → MLRO review → approved
6. High-risk customer → rejected
7. RAI issued → customer responds → approved
8. PEP self-declaration → MLRO queue → approved
9. Unacceptable risk → senior management sign-off
10. Session interrupted → resumed → completed

### 3. Milestone Task List
| Task ID | Title | Status |
|---|---|---|
| M5-T01 | PII audit: automated scan of log outputs + sanitise() utility | `todo` |
| M5-T02 | RLS policy pgTAP test suite (complete) | `todo` |
| M5-T03 | Audit trail completeness test | `todo` |
| M5-T04 | Signed URL access test | `todo` |
| M5-T05 | Error boundaries + graceful failure states | `todo` |
| M5-T06 | MLRO walkthrough (complete high-risk case) | `todo` |
| M5-T07 | 10 onboarding scenarios end-to-end | `todo` |

### 4. Milestone Checklist
- [ ] All 10 scenarios pass end-to-end without errors
- [ ] Zero PII in log output across any scenario (automated scan passes)
- [ ] All RLS policies pass pgTAP test suite (correct + wrong tenant contexts)
- [ ] Audit trail completeness: every step in all 10 scenarios has audit event
- [ ] Signed URL: access denied without valid session
- [ ] Signed URL: expires after 15 minutes
- [ ] IDV unavailable: session paused, not crashed; manual review triggered
- [ ] Screening provider unavailable: case put in manual queue, not failed
- [ ] Load test: 50 concurrent sessions → no degradation
- [ ] PgBouncer connection pooling configured and tested
- [ ] No secrets in code (git grep passes for common secret patterns)
- [ ] No public Supabase Storage URLs (all private bucket confirmed)
- [ ] Soft-delete: no hard deletes possible from application layer
- [ ] MLRO confirms complete case management flow is operationally usable
- [ ] Audit log export: produces compliant audit report for test customer

### 5. Milestone Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| MLRO not available for walkthrough | Medium | High | Schedule walkthrough 2 weeks before planned production date |
| PII found in log output (hard to find all instances) | Medium | High | Automated scan + code review; test with real-looking synthetic data |
| RLS edge cases missed in pgTAP tests | Low | Critical | Review every table against every role; include service role bypass tests |

### 6. Milestone Blockers
- Milestones 1–4 acceptance criteria not met
- MLRO not appointed or not available (C-09)

### 7. Milestone Acceptance Checklist
- [ ] All 10 onboarding scenarios pass end-to-end
- [ ] Zero PII in log output (automated + manual verification)
- [ ] All RLS policies pass pgTAP test suite
- [ ] MLRO sign-off: "complete case management flow is operationally usable"
- [ ] Audit log export: produces structured, compliant audit report

### 8. Milestone Handoff Checklist (Before Starting Milestone 6)
- [ ] MLRO sign-off documented in writing
- [ ] Security review checklist complete (or issues documented with timeline for resolution)
- [ ] All automated tests passing on staging
- [ ] Penetration test scheduled (acceptable to complete post-launch for MVP)
- [ ] Load test results documented
- [ ] Operational runbook draft available for M6 review
- [ ] Production Supabase project created (paid plan, PITR)

---

## MILESTONE 6 — Production Deployment and Operational Readiness

### 1. Milestone Objective
Deploy the MVP to production with monitoring, backup, operational runbook, and first real customer onboarded.

### 2. Milestone Scope
- Production Supabase project (separate from staging), paid plan, PITR enabled
- Production Vercel project, production env vars, domain, SSL confirmed
- Monitoring: Vercel log drain + Sentry + Supabase dashboard alerts
- pg_cron jobs activated: document expiry check (daily), failed webhook retry (hourly)
- Supabase daily backup confirmed + restoration test completed
- Operational runbook written and reviewed
- First tenant fully onboarded to production (internal or pilot)
- Incident response contact list documented

### 3. Milestone Checklist
- [ ] Production Supabase: paid plan, PITR enabled, daily backup confirmed
- [ ] Production Supabase: all migrations applied cleanly
- [ ] Production Vercel: deployment live from main branch
- [ ] Production domain: DNS configured, SSL certificate active
- [ ] Sentry: error tracking active; test error received and alert fired
- [ ] Vercel log drain: logs forwarding to destination
- [ ] Supabase dashboard alerts: configured for key metrics
- [ ] pg_cron: document_expiry job runs daily (confirmed from logs)
- [ ] pg_cron: retry_failed_webhooks job runs hourly (confirmed from logs)
- [ ] Backup: restoration test completed successfully
- [ ] Runbook: covers 3 minimum scenarios (failed onboarding, webhook retry, audit report)
- [ ] First real customer: full onboarding flow completed on production
- [ ] Monitoring dashboard: active sessions, case queue depth, webhook success rate visible

### 4. Milestone Acceptance Checklist
- [ ] Production smoke test: full onboarding flow works on production
- [ ] Sentry receives a test error and alert fires
- [ ] pg_cron document expiry job runs successfully (confirm from Supabase logs)
- [ ] Backup restoration test: data restored correctly
- [ ] Monitoring dashboard: key metrics visible and accurate

### 5. Milestone Handoff — Post-Launch
- [ ] Incident response contact list distributed to all relevant team members
- [ ] Phase 2 planning session scheduled
- [ ] Corporate KYB requirements confirmed for Phase 2 prioritisation
- [ ] First production customer's onboarding reviewed by MLRO

---

*Milestone Checklists v1.0 · Generated from PRD v1.0 + DevPlan v1.0 · TruVis International Services · 2026*
