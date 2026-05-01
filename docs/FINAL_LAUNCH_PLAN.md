# FINAL LAUNCH PLAN — TruVis AML/KYC/CDD Portal

> **Status:** Canonical planning document. Replaces `MVP_TODO.md`, `BUILD_ORDER.md`, `MILESTONE_1_PLAN.md`, `TASK_PACKS.md`, `PRD_VS_BUILT_GAP_ANALYSIS.md`. Supersedes the "what is built vs needed" sections of `ROLES_DASHBOARDS_FLOWS.md`.
> **Audience:** Product, Engineering, Compliance, Sales.
> **Date:** 2026-05-01.
> **Goal:** After completing the work in this plan, the platform is fit for SaaS sale and public launch in the UAE/GCC market.

---

## 1. Executive Summary

### 1.1 Where we actually are (corrected)

The previously-checked-in docs are **stale**. A live audit of the codebase shows we are materially further along than the docs claim:

| Capability | Old doc said | Actual state |
|---|---|---|
| Role-specific dashboards | Generic only — needs build | **All 7 dashboards built** with real queries (`components/dashboards/*`) |
| SAR Register | Not built | **Built** with goAML XML export (`modules/sar/goaml-builder.ts`, `app/(platform)/sar/`) |
| Reporting page | Not built | **Built** with 6 real aggregate queries |
| IDV (Sumsub) | Stub / webhook only | **Live** — real Web SDK, applicant create, webhook processor (`components/onboarding/idv-form.tsx`, edge fn `process-idv-webhook`) |
| Edge functions dir | Not present | **Present** — `compute-document-hash`, `process-idv-webhook`, `process-screening-webhook`, `retry-failed-webhooks` |
| Webhook queue + retry | Not built | **Built** (migration 0028 + cron + edge fn) |
| Email (Resend) | Stub | **Live** with templates and `notification_events` log |
| Tenant config versioning | JSONB only | **Versioned table** (migration 0030) + history UI |
| Workflow MLRO ack | UI-only | **Server-enforced** (migration 0031 + API route) |
| Customer detail w/ versions | Needs work | **Full version history** + audit trail UI |
| Marketing site | Single landing | **14 marketing pages** including legal, pricing, comparisons |
| Self-serve signup + billing | Not built | **Scaffolded** (Nomod payment integration, signup form, tenant create API) |

### 1.2 Where we still have to go to be sale-ready

Three buckets:

1. **Compliance / hygiene fixes (this sprint, must-do):**
   - **Remove competitor names from all customer-facing surfaces.** The brief is explicit: "do not use any name of them anywhere in our contents." We currently name Sumsub and Azakaw on the landing page, two dedicated `/compare/*` pages, the product page, the integrations strip, and the industry grid. (Sumsub stays on `legal/sub-processors` — that is mandated PDPL/GDPR disclosure since they are our actual IDV processor.)
   - Stale planning docs deleted/replaced.
   - End-to-end test suite covering the 7 role workflows.

2. **Regional must-haves (next 1–2 sprints, gate to UAE pilot):**
   - **i18n + Arabic + RTL** for the customer-facing onboarding flow.
   - **UAE Pass** identity bridge.
   - **Emirates ID** parse + validation hook.
   - **goAML XML** validated against the FIU XSD (we have a builder; we don't yet validate against the real schema).
   - **DFSA / FSRA / CBUAE rule packs** as selectable workflow templates.
   - **Ongoing monitoring (M-14)** — scheduled re-screening, doc expiry alerts.
   - **UBO engine (M-04)** — recursive resolution + tree visual.

3. **Vendor-grade polish (gate to public marketing launch):**
   - **Visual workflow builder** UI on top of our existing JSON schema.
   - **Web SDK** (drop-in iframe + JS lib) for tenants to embed customer onboarding.
   - **Public API docs** at `/docs/api` plus a sandbox tenant.
   - **SOC 2 Type I scoping** kicked off (Type II takes 12 months).
   - **Operational runbook** + monitoring (Sentry + log drain + alerts) live.
   - **Vertical packs** (Fintech, DNFBP, Real Estate, Crypto/VARA) shipped as templates.

We can ship #1 in days, #2 in 4–6 weeks, #3 in 8–10 weeks. **We can sell into a friendly UAE pilot tenant after #1 + #2.** We hold public-launch / open-signup until #3.

---

## 2. Modeled Feature Inventory (no competitor names in our content)

We model two reference vendors. We do not name them in code or marketing.

- **Vendor A** = global IDV/AML leader (broad doc library, deepfake detection, Travel Rule, reusable KYC, no-code builder). They do not target UAE specifically.
- **Vendor B** = UAE/GCC-native compliance OS (UAE Pass, Emirates ID, goAML, DFSA/FSRA/CBUAE rule packs, Arabic UI, vertical templates). **Closer to our positioning.**

### 2.1 Table-stakes for the category (from both)

| Surface | Feature | Status with us |
|---|---|---|
| Identity | OCR + MRZ + global doc template library | Provided by IDV vendor — done |
| Identity | Active + passive liveness, face match | Provided by IDV vendor — done |
| Identity | Deepfake / spoof detection | Provided by IDV vendor — done |
| Business | Registry lookup | **Missing** |
| Business | UBO graph + threshold | Form ✅, recursion ❌, visual ❌ |
| Screening | Sanctions + PEP + adverse media | Sanctions+PEP done; **adverse media flag not enabled** |
| Screening | Ongoing monitoring with re-screen | **Missing** (M-14) |
| Risk | Multi-dimension scoring | 3 dims done; channel + relationship missing |
| Workflow | No-code visual builder | **Missing** — JSON only |
| Cases | Queue, SLA, RAI, escalation, audit | Done; **SLA breach alerts missing** |
| Reporting | Aggregate metrics + SAR export | Done |
| Audit | Append-only, hash chain, export | Done |
| Dist | Public REST API + sandbox + docs | API exists; **no published docs / no sandbox** |
| Dist | Web SDK / drop-in widget | **Missing** |
| Trust | SOC 2 Type II | **Not started** |

### 2.2 UAE/GCC-specific must-haves (from Vendor B's positioning)

| Surface | Feature | Status with us |
|---|---|---|
| Auth | UAE Pass identity bridge | **Missing** |
| ID | Emirates ID parse + validation | **Missing** (delegated to IDV but not surfaced as a first-class field) |
| FIU | goAML XML SAR/STR (XSD-validated) | Builder ✅; **XSD validation against real schema needed** |
| Regulator | DFSA / FSRA / CBUAE rule packs | **Missing** |
| Lang | Arabic UI + full RTL | **Missing** |
| Jurisdiction | DIFC / ADGM / mainland switch | **Missing** as a tenant config |
| KSA | Yakeen / Absher / Tasdeeq adapter shims | **Missing** (defer until KSA tenant signed) |
| Residency | UAE/GCC region | Vercel `me1` (Bahrain) + Supabase region — done |

### 2.3 Differentiators we should lean on

We **out-execute on these**, not try to out-feature on IDV depth:

1. **Audit-grade compliance backbone** — append-only, hash-chained audit, RLS on every table, immutable customer/business data versions, immutable approvals — vendor-grade evidentiary defensibility.
2. **MLRO-first workbench** — case detail tabs, screening hit resolution, SAR flagging with tipping-off masking, EDD section visible to MLRO/SR only, audit trail tied to every action.
3. **White-label & multi-tenant rigor** — per-tenant config versioning, branding, workflow versions, true tenant isolation at DB layer.
4. **Adapter pattern** — screening provider, IDV provider, billing provider all replaceable without business-logic changes.
5. **UAE/GCC-native posture** — region pinned, regulator templates, Arabic, goAML.
6. **Honest, technical, MLRO-targeted marketing** — no inflated claims, public security page, real DPA, sub-processors disclosed.

### 2.4 Deferred (acknowledged, not v1)

- Travel Rule / VASP attribution (crypto-specific niche).
- 50-language ACDR document reading.
- Predictive future-risk ML scoring (no training data at launch).
- Video KYC (regulator no-objection per jurisdiction).
- Reusable KYC across tenants (ecosystem play; needs customer base first).
- 600+ pre-built TM scenarios (start with ~20 high-value rules).

---

## 3. PRD Module Status (corrected)

Status legend: ✅ BUILT · 🟡 PARTIAL · ❌ MISSING

| # | Module | MVP per PRD | Status | What remains for "vendor-grade" |
|---|---|---|---|---|
| M-01 | Onboarding Orchestrator | Yes | ✅ | A/B test, drop-off analytics |
| M-02 | Individual KYC | Yes | ✅ (with real IDV) | Emirates ID first-class field; UAE Pass pathway |
| M-03 | Corporate KYB | Phase 2 | ✅ | Registry API lookup; visual ownership tree |
| M-04 | UBO Engine | Phase 2 | ❌ | Recursive resolution; threshold config; tree viz; listed-entity exemption |
| M-05 | CDD | Yes | 🟡 | Routing works; no distinct CDD package vs KYC |
| M-06 | EDD | Yes | 🟡 | Risk routes to EDD queue; **no EDD-specific form** (source of wealth, audited financials, narrative) |
| M-07 | Screening | Yes | 🟡 | Sanctions+PEP done; **enable adverse media flag**; custom watchlists; batch re-screen |
| M-08 | Risk Scoring | Yes (3-dim) | 🟡 | Add channel + relationship dims; tenant-configurable weights with MLRO gate |
| M-09 | Document Mgmt | Yes | ✅ | OCR/auto-validation; expiry alerts |
| M-10 | Case Mgmt | Yes | ✅ | SLA breach alerts; bulk actions; case linking |
| M-11 | Approval Workflow | Yes | ✅ | Multi-stage / parallel approval paths |
| M-12 | Audit Trail | Yes | ✅ | Add hash chain (PRD §5.5); WORM S3 backup |
| M-13 | Consent | Yes | ✅ | Withdrawal halt-processing; DSR (access/erasure) intake |
| M-14 | Ongoing Monitoring | Phase 2 | ❌ | **Build for v1 launch** — re-screen cron, doc expiry, registry-change watcher, post-onboarding adverse media |
| M-15 | Admin + Workflow Builder | Yes (basic) | 🟡 | Config CRUD ✅; **visual no-code workflow builder ❌** |
| Cross | Notifications | — | ✅ | SMS, WhatsApp, in-app |
| Cross | Reporting | Yes | ✅ | Real-time, SAR/STR export with goAML XSD validation |
| Cross | Webhooks infra | — | ✅ | OK |
| Cross | i18n | — | ❌ | Arabic + full RTL |
| Cross | Public API + SDK | — | ❌ | OpenAPI, sandbox, Web SDK |
| Cross | Billing | — | 🟡 | Nomod scaffold present; needs real connection + invoice surface |

---

## 4. Per-Role Dashboard Review & Improvements

All 7 dashboards exist and are wired. The fixes below are **enhancement**, not "build from zero."

### 4.1 Platform Super Admin (`/admin/platform`)
**Status:** Built. **Improve:**
- Cross-tenant health table with sortable columns (open cases, sessions today, last activity, queue depth)
- Per-tenant billing status (active / past-due / trialing) once real billing is connected
- Webhook delivery success rate per tenant (24h / 7d)
- Audit-only view of recent platform-level events with filter
- "Impersonate tenant" (read-only) action with audit event — for support

### 4.2 Tenant Admin
**Status:** Built. **Improve:**
- Onboarding "completeness score" (% of required setup done) with deep-links
- Trial countdown / billing status banner
- Outstanding invitations list with re-send action
- Workflow-version drift alert ("MLRO has not acknowledged the latest version")
- "Today" vs "this week" vs "this month" toggle on volume widgets

### 4.3 MLRO
**Status:** Built. **Improve:**
- 30-day trend sparkline on each top-of-funnel stat card
- "Cases overdue per SLA band" widget once SLA is built
- Adverse media hits (separate queue once M-07 adverse media is enabled)
- "SAR drafts pending submission" widget linked to SAR Register
- Quick filter pills for queue navigation: high-risk / EDD / escalations / SAR

### 4.4 Senior Reviewer
**Status:** Built. **Improve:**
- "My average decision time" personal stat
- Cases I escalated upstream + their current status
- Bulk action shortcut (assign / re-prioritize) once bulk actions ship

### 4.5 Analyst
**Status:** Built. **Improve:**
- "Pending RAI responses" with received-since-last-login indicator
- Document inbox (newly uploaded on my cases) with "verify" deep-link
- Personal SLA gauge

### 4.6 Onboarding Agent
**Status:** Built. **Improve:**
- "Resume session" deep-links from in-progress sessions
- Customer lookup search box on the dashboard
- New session quick-launch presets (vertical templates once built)

### 4.7 Read-Only
**Status:** Built. **Improve:**
- Add "month-over-month" deltas on every metric
- Time range selector (last 30 / 90 / YTD)
- Export-to-CSV on each widget
- Confirm zero PII surfacing — audit any join paths to be sure

---

## 5. End-to-End Test Scenario Matrix

A regression suite that proves "the product works end to end for every role" before we sell to anyone. Each scenario must be runnable against staging with seed data.

### 5.1 Customer journeys

| ID | Scenario | Expected outcome |
|---|---|---|
| C-01 | Happy path individual KYC, low risk | Auto-approved, no case created, customer email sent |
| C-02 | Individual KYC, medium risk | Case routed to Analyst queue |
| C-03 | Individual KYC, high risk | Case routed to Senior Reviewer queue |
| C-04 | Individual KYC, unacceptable risk | Case routed to MLRO queue |
| C-05 | Corporate KYB, all UBOs identified | Each UBO gets KYC sub-flow; entity case created |
| C-06 | Session abandoned mid-flow | Resumable from saved step on return |
| C-07 | Consent declined | No data captured; session terminated; audit event |
| C-08 | Document upload + hash | `documents` row created; hash populated within 10s |
| C-09 | IDV liveness fail | Result stored; case routed to manual review |
| C-10 | IDV duplicate webhook | Idempotent — single `kyc_results` row |
| C-11 | Screening hit (false positive) | Analyst resolves; case proceeds |
| C-12 | Screening hit (true match) | Escalated to MLRO; case stays open |
| C-13 | PEP self-declaration true | EDD path triggered; MLRO involved |
| C-14 | RAI issued | Customer email sent; status `pending_info`; resume → status `in_review` |
| C-15 | Customer rejection | Email sent (tipping-off-safe wording); case closed; immutable |
| C-16 | Re-onboarding existing customer | Treated as new session; new versioned data row |

### 5.2 Role workflows (per role × per dashboard CTA)

| ID | Role | Action | Expected |
|---|---|---|---|
| R-01 | Platform Super Admin | Create tenant via /admin/platform | Tenant + admin invite + audit event |
| R-02 | Tenant Admin | Invite user with role | Email sent; user activates; correct role assigned |
| R-03 | Tenant Admin | Activate workflow without MLRO ack | Server blocks (403); audit event |
| R-04 | Tenant Admin | Edit branding | Logo appears on `/{tenantSlug}/onboard` |
| R-05 | Tenant Admin | Edit risk thresholds | New `tenant_config` version; audit event |
| R-06 | MLRO | Acknowledge workflow version | `workflow_activation_acks` row; admin can now activate |
| R-07 | MLRO | Flag SAR on a case | Audit event; case appears in `/sar`; analyst SR cannot see flag |
| R-08 | MLRO | Export goAML XML for SAR | Valid XML file (against FIU XSD once integrated) |
| R-09 | MLRO | Approve high-risk case | Approval recorded immutably; audit event |
| R-10 | MLRO | Open audit log + filter by customer | Returns full chronology; export JSON-L works |
| R-11 | Senior Reviewer | Approve standard-risk case | Approval recorded; case closed |
| R-12 | Senior Reviewer | Escalate to MLRO | Queue switched; MLRO sees it |
| R-13 | Analyst | Verify document | `documents.verification_status` updated; audit event |
| R-14 | Analyst | Resolve screening hit | `screening_hit_resolutions` row; immutable |
| R-15 | Analyst | Add internal note | Note saved as case event; immutable |
| R-16 | Analyst | Request additional info | Email sent; status `pending_info` |
| R-17 | Analyst | Try to approve high-risk case | Blocked by RBAC (403) |
| R-18 | Onboarding Agent | Start individual onboarding for walk-in | Session created in agent's name |
| R-19 | Onboarding Agent | Resume stuck session | Picks up at correct step |
| R-20 | Read-Only | View reporting dashboard | Aggregate metrics only; no PII anywhere |
| R-21 | Read-Only | Try to access /cases | Blocked by middleware |

### 5.3 Cross-cutting & security

| ID | Scenario | Expected |
|---|---|---|
| S-01 | Cross-tenant JWT attempt on /cases/[id] | 403 (proxy + RLS double gate) |
| S-02 | Service-role import in `app/` | Build/CI fail (lint guard) |
| S-03 | UPDATE on `audit_log` | Postgres exception |
| S-04 | DELETE on `audit_log` | Postgres exception |
| S-05 | Signed URL TTL > 15 min | Reject |
| S-06 | Bare UPDATE on customer PII fields | Blocked; must go through `customer_data_versions` |
| S-07 | Webhook retries on transient failure | Exponential backoff via pg_cron; reaches `processed` |
| S-08 | Webhook permanently failing | Lands in `dead_letter` after N retries |
| S-09 | PII in any application log | `npm run check:pii` fails CI |
| S-10 | Cross-tenant Realtime subscription | Receives nothing (RLS) |
| S-11 | Cross-tenant signed URL fetch | 403 |
| S-12 | MLRO without MFA visiting /sar | Redirect to /mfa-setup |
| S-13 | New user invited then deactivated | Cannot sign in; existing sessions revoked |

### 5.4 Performance / scale

| ID | Scenario | Expected |
|---|---|---|
| P-01 | 50 concurrent onboarding sessions | No degradation; no row-level lock contention |
| P-02 | Cases page with 5,000 records | First page renders < 1.5s; pagination correct |
| P-03 | Audit log with 1M rows, customer-id filter | < 1s with index; export < 30s |
| P-04 | Document upload 50MB | Direct-to-Storage; no proxy through API |
| P-05 | Realtime subscription with 200 watchers | No dropped events |

**Test framework:** Vitest for unit; Playwright for e2e (to be added); pgTAP for DB. We currently have 7 unit + 16 db tests; we need ~30 e2e scenarios + ~15 more pgTAP for new RLS introduced by upcoming features.

---

## 6. Marketing Site / Landing / Design Fixes

### 6.1 P0 (this sprint) — strip competitor names from customer-facing surfaces

**Files to fix:**

| File | Action |
|---|---|
| `app/(marketing)/page.tsx` | Replace "Sumsub" / "Azakaw" mentions; remove `competitor=` props from `ComparisonTable` block; replace with generic "global IDV vendor" / "regional GCC vendor" framing |
| `app/(marketing)/compare/sumsub/page.tsx` | **Delete**; redirect to `/compare` index that compares us to "global IDV platforms" generically |
| `app/(marketing)/compare/azakaw/page.tsx` | **Delete**; redirect to `/compare` index that compares us to "regional GCC compliance OS" generically |
| `app/(marketing)/product/page.tsx` | "Sumsub IDV" → "embedded identity verification" |
| `components/marketing/IntegrationsStrip.tsx` | Drop "Sumsub" from the visible chip list; keep in legal sub-processors |
| `components/marketing/IndustryGrid.tsx` | "Sumsub IDV passthrough" → "verified identity passthrough" |
| `app/(marketing)/legal/sub-processors/page.tsx` | **KEEP** Sumsub here — required PDPL/GDPR processor disclosure; this is not "marketing copy" |

**Replacement copy pattern:** describe what we do, not who we beat. E.g., "Identity verification with liveness, document OCR and face match, embedded in your tenant workflow."

### 6.2 P1 — content/design improvements

- **Industry pages**: build out real estate, law firms (DNFBPs), accounting, CSPs, crypto/VARA. We have `/for/fintechs` and `/for/dnfbps` — extend to 6 verticals.
- **Public security page** — already exists; add SOC 2 status (in-progress badge), pen-test status, ISO 27001 roadmap, and a downloadable security overview PDF.
- **API docs** at `/docs/api` — autogenerated from Zod schemas + manual narrative.
- **Sandbox tenant** signup at `/signup?plan=sandbox` — auto-creates a test tenant with synthetic data, expires in 14 days.
- **Customer story page** structure (empty until first reference customer signs).
- **Arabic landing page variant** — `next-intl` with Arabic translation of the home, product, pricing, security pages and onboarding.
- **Trust badges line** — replace generic logos with real certifications + pending statuses ("SOC 2 Type I — in progress").
- **Pricing page** — confirm tier names, add a "request quote" path, expose what's metered (verifications, screenings, seats).

### 6.3 Design system — verify before launch

- All marketing pages render correctly on mobile (320px → 1440px) — verify in browser.
- Dashboard pages render correctly at 1280px and 1920px.
- Color contrast meets WCAG AA on all interactive elements.
- Loading and error states defined for every page (not just happy path).
- Empty states designed for every list (cases, customers, sar, audit).

---

## 7. Documentation Cleanup

### 7.1 Delete

These are stale or planning-phase docs whose value is captured by this plan:

- `docs/MVP_TODO.md` — task statuses are out of date and overlap with the milestone checklists.
- `docs/BUILD_ORDER.md` — was a one-shot Phase 0/1 dependency map; M1 is complete.
- `docs/MILESTONE_1_PLAN.md` — M1 is complete; merge any still-relevant notes into RUNBOOK.
- `docs/PRD_VS_BUILT_GAP_ANALYSIS.md` — superseded by §3 + §4 of this plan; keeping it creates conflicting source of truth.
- `docs/TASK_PACKS.md` — merge any unfinished items into the sprint backlog under §9.

### 7.2 Keep & update

- `docs/MILESTONE_CHECKLISTS.md` — keep as the **acceptance criteria** reference for the milestones already shipped; mark M1–M4 as complete with date; mark M5–M6 with the work in §9.
- `docs/ROLES_DASHBOARDS_FLOWS.md` — keep §1–§10 as policy doc; **delete §11–§13** (the "current state vs required" tables that are now wrong); link to this plan instead.
- `docs/RUNBOOK.md` — keep; expand with: pre-launch checklist (§10), incident response, on-call rotation, restore-from-backup test results.
- `docs/DEPLOYMENT.md` — keep; add: Vercel env var checklist, Supabase secret rotation, Resend domain SPF/DKIM/DMARC.
- `CLAUDE.md` — keep; remove milestone status block (§Milestone Status) and link to the milestone checklists instead so the AI doesn't get stale data.
- `KYC AML Onboarding PRD v1.docx` — keep as the immutable product spec; do not edit.

### 7.3 Add

- `docs/FINAL_LAUNCH_PLAN.md` — this document.
- `docs/TEST_SCENARIOS.md` — extracted from §5 of this doc; one row per scenario; status column for "passing on staging".
- `docs/SECURITY_OVERVIEW.md` — public-facing security claims + their internal evidence references.
- `docs/API.md` — narrative companion to the OpenAPI spec at `/docs/api`.
- `docs/I18N.md` — Arabic translation workflow, key naming conventions, RTL CSS rules.
- `docs/RELEASE_CHECKLIST.md` — pre-deploy gate (typecheck, tests, db migration dry-run, smoke test).

After cleanup the `docs/` folder is: `FINAL_LAUNCH_PLAN.md`, `MILESTONE_CHECKLISTS.md`, `ROLES_DASHBOARDS_FLOWS.md`, `RUNBOOK.md`, `DEPLOYMENT.md`, `TEST_SCENARIOS.md`, `SECURITY_OVERVIEW.md`, `API.md`, `I18N.md`, `RELEASE_CHECKLIST.md`. Ten files instead of nine, but all current.

---

## 8. Phased Implementation Plan

Three sprints. Each ends with a demonstrable, testable ship gate. No work beyond #1 starts until #1 lands on `main`.

### Sprint 1 — Compliance hygiene + dashboard polish (1 week)

**Goal:** product is internally consistent, customer-facing copy is clean, regression suite is in place. Internal demo to a friendly UAE prospect is possible.

| # | Task | Owner |
|---|---|---|
| 1.1 | Strip competitor names from marketing surfaces per §6.1 | FE |
| 1.2 | Delete `compare/sumsub` and `compare/azakaw`; build generic `/compare` page | FE |
| 1.3 | Per-dashboard improvements per §4 (sparklines, deltas, deep-links, completeness scores) | FE |
| 1.4 | Empty states + loading states for every list page | FE |
| 1.5 | Mobile + desktop QA pass on all pages | FE |
| 1.6 | Add Playwright e2e harness; implement scenarios C-01 through C-08 + R-01 through R-12 | QA |
| 1.7 | Add pgTAP coverage for screening hits, risk assessments, SAR reports, tenant_billing | DB |
| 1.8 | Docs cleanup per §7 (delete + add) | PM |
| 1.9 | `npm run check` green on CI | DevOps |

**Ship gate:** all P0 marketing fixes merged; `npm run check` passes; e2e suite (≥ 20 scenarios) runs green on staging; updated docs reviewed.

### Sprint 2 — UAE/GCC must-haves + ongoing monitoring (3–4 weeks)

**Goal:** product is fit to onboard a UAE-licensed pilot tenant. Arabic onboarding works. SAR export validates against real FIU schema. Re-screening is alive.

| # | Task | Owner |
|---|---|---|
| 2.1 | i18n scaffolding (`next-intl`); extract all customer-facing strings to message catalog | FE |
| 2.2 | Arabic translation pass for onboarding flow + emails | FE + Compliance |
| 2.3 | Full RTL CSS audit on customer-facing surfaces | FE |
| 2.4 | UAE Pass identity bridge (OIDC), surfaced as a customer-facing "Sign in with UAE Pass" path on onboarding | BE + FE |
| 2.5 | Emirates ID first-class field on individual KYC + parse helper | BE |
| 2.6 | goAML XSD validation in `goaml-builder.ts`; fixture-based tests | BE |
| 2.7 | M-07 adverse media flag enabled in screening adapter; new hit type surfaced | BE + FE |
| 2.8 | M-14 ongoing monitoring v1: pg_cron monthly re-screen of approved customers; doc-expiry alerts; new audit events | BE + DB |
| 2.9 | M-04 UBO engine: recursive resolution, threshold config, simple tree visual on customer detail | BE + FE |
| 2.10 | M-06 EDD form: source of wealth, source of funds narrative, audited financials upload, surfaced when risk band is high+ | BE + FE |
| 2.11 | DFSA / FSRA / CBUAE rule packs as workflow templates in `admin-config` | BE |
| 2.12 | Implement test scenarios C-09 through C-16 + R-13 through R-21 + S-01 through S-13 | QA |
| 2.13 | Hash-chained audit log per PRD §5.5 (add `prev_hash`, trigger, verification CLI) | DB |

**Ship gate:** UAE pilot tenant can onboard a real customer in Arabic via UAE Pass + Emirates ID, get screened including adverse media, route through risk + EDD if needed, and get a SAR exported in valid goAML XML if MLRO flags. Ongoing monitoring re-screens them at month-1.

### Sprint 3 — Vendor-grade SaaS polish (4–6 weeks)

**Goal:** any prospect can self-serve a sandbox tenant, embed a Web SDK, configure workflows visually, and read public API docs. SOC 2 path is started.

| # | Task | Owner |
|---|---|---|
| 3.1 | Visual workflow builder UI (React Flow over existing JSON schema); sandbox preview | FE |
| 3.2 | Web SDK (drop-in iframe + JS lib) for the customer-facing onboarding flow | FE |
| 3.3 | Public API: version under `/v1`; OpenAPI spec generated from Zod; `/docs/api` page | BE + FE |
| 3.4 | Sandbox tenant signup at `/signup?plan=sandbox` with seed data + 14-day expiry | BE |
| 3.5 | Vertical templates: Fintech, Corporate, Real Estate, DNFBP, Crypto/VARA | Product + BE |
| 3.6 | SLA tracking + breach alerts (email + dashboard widget) | BE + FE |
| 3.7 | Bulk case actions (assign, prioritize, close batch) | FE |
| 3.8 | Multi-stage / parallel approval paths (M-11 phase 2) | BE |
| 3.9 | Channel + Relationship dimensions in risk scoring (5-dim per PRD) | BE |
| 3.10 | Tenant-configurable risk weights with MLRO acknowledgement | BE + FE |
| 3.11 | Sentry, Vercel log drain, Supabase alerts wired | DevOps |
| 3.12 | SOC 2 Type I scoping kicked off; control mapping doc | Compliance |
| 3.13 | Self-serve billing live (Nomod TODOs resolved); invoice surface | BE + FE |
| 3.14 | Performance test scenarios P-01 through P-05 | QA |
| 3.15 | Backup + restore test on production Supabase | DevOps |
| 3.16 | Operational runbook v1 reviewed with on-call team | PM |

**Ship gate:** prospect signs up at `/signup`, embeds `<script src="…/sdk/v1.js">`, configures a workflow visually, runs a synthetic customer end-to-end, exports an audit pack — without any TruVis support intervention. Sentry receives a test error and alerts. Backup restoration test passes.

---

## 9. Sprint Backlog (one row per work item, ordered)

This is the queue. It's a flattened version of §8.

```
Sprint 1
S1-01  Strip "Sumsub"/"Azakaw" from marketing surfaces (§6.1)
S1-02  Delete /compare/sumsub + /compare/azakaw, build generic /compare
S1-03  Dashboard improvements per §4 (all 7 dashboards)
S1-04  Empty + loading states audit for all list pages
S1-05  Playwright harness + e2e scenarios (≥20)
S1-06  Add pgTAP for screening_hits, risk_assessments, sar_reports, tenant_billing
S1-07  Docs cleanup per §7 — delete stale + add new
S1-08  CI green: typecheck + lint + tests + check:pii + e2e

Sprint 2
S2-01  next-intl scaffolding
S2-02  Arabic message catalog + translation pass (onboarding + emails)
S2-03  RTL CSS audit on customer-facing surfaces
S2-04  UAE Pass OIDC bridge end-to-end
S2-05  Emirates ID first-class field + parse helper
S2-06  goAML XSD validation + fixture tests
S2-07  Enable adverse media in screening adapter; new hit type UI
S2-08  Ongoing monitoring v1 (pg_cron re-screen + doc expiry)
S2-09  UBO engine: recursion + threshold + tree viz
S2-10  EDD form: source of wealth/funds, audited financials upload
S2-11  Rule packs: DFSA, FSRA, CBUAE as workflow templates
S2-12  Hash-chained audit log (prev_hash + trigger + CLI verify)
S2-13  Remaining test scenarios (C-09→C-16, R-13→R-21, S-01→S-13)

Sprint 3
S3-01  Visual workflow builder (React Flow over JSON schema)
S3-02  Web SDK (iframe + JS lib) for customer onboarding
S3-03  Public API /v1 + OpenAPI spec + /docs/api
S3-04  Sandbox tenant signup + seed + auto-expiry
S3-05  Vertical templates (Fintech, Corporate, Real Estate, DNFBP, Crypto)
S3-06  SLA tracking + breach alerts
S3-07  Bulk case actions
S3-08  Multi-stage / parallel approval paths
S3-09  5-dim risk scoring (add channel + relationship)
S3-10  Tenant-configurable risk weights with MLRO ack
S3-11  Sentry + log drain + Supabase alerts
S3-12  SOC 2 Type I scoping + control map
S3-13  Self-serve billing live (resolve Nomod TODOs)
S3-14  Performance scenarios P-01→P-05
S3-15  Backup + restore test on prod
S3-16  Runbook v1 review with on-call team
```

---

## 10. Pre-Sale Readiness Checklist

Tick every box before quoting a paying customer.

### 10.1 Product
- [ ] All Sprint 1 + Sprint 2 ship gates met
- [ ] At least 90% of test scenarios in §5 passing on staging
- [ ] No `TODO`, `FIXME`, or commented-out code in `modules/` or `app/api/`
- [ ] Branding: tenant can upload logo, set primary color, customize email "from" name
- [ ] Customer-facing flow has been QA'd in Arabic by a native speaker
- [ ] No competitor name appears anywhere in customer-facing copy

### 10.2 Compliance
- [ ] DPA reviewed by legal (UAE PDPL + ADGM DPR + DIFC PDPL)
- [ ] Privacy policy reviewed by legal
- [ ] Sub-processor list current (Supabase, Vercel, Resend, Sumsub, ComplyAdvantage, Nomod)
- [ ] MLRO acknowledgment workflow tested on a real workflow
- [ ] Audit log export produces a regulator-ready PDF/JSON-L
- [ ] goAML XML validates against current FIU XSD
- [ ] Retention policies configured per `tenant_config`; tested at boundary

### 10.3 Security
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` import in `app/` (CI guard)
- [ ] All RLS policies covered by pgTAP for correct + wrong tenant
- [ ] All routes covered by middleware role guard
- [ ] MFA enforced for tenant_admin, mlro, super_admin
- [ ] Signed URLs default to ≤ 15 min TTL
- [ ] `npm run check:pii` passes on every commit
- [ ] Pen test scheduled (acceptable post-launch for first tenant)
- [ ] Vulnerability scan run on dependencies (npm audit)

### 10.4 Operations
- [ ] Sentry receiving errors from prod; alerts firing to on-call
- [ ] Vercel log drain wired
- [ ] Supabase: paid plan, PITR enabled, daily backup confirmed, restore tested
- [ ] pg_cron jobs verified running (re-screen hourly + retry-failed-webhooks hourly)
- [ ] Webhook queue: retries on transient fail, lands in dead-letter on permanent
- [ ] Runbook v1 covers: failed onboarding, failed webhook, audit export, customer DSR, secret rotation
- [ ] On-call rotation defined; PagerDuty (or equivalent) wired

### 10.5 Sales / Commercial
- [ ] Pricing page final with confirmed tier descriptions
- [ ] Self-serve signup creates trial tenant
- [ ] Billing live (Nomod) — at least one synthetic charge succeeded end-to-end
- [ ] Demo tenant with seed data ready for sales calls
- [ ] One reference architecture diagram public on `/security`
- [ ] Customer story slot ready (placeholder until first signs)

### 10.6 Documentation
- [ ] Public API docs at `/docs/api` complete for v1
- [ ] Web SDK quickstart in `/docs` with copy-paste snippet
- [ ] Internal docs in `docs/` reflect §7.3 (10 files, all current)
- [ ] CLAUDE.md updated for AI agents working on the codebase

---

## 11. Open Questions (decision required before Sprint 2 starts)

1. **Self-serve vs sales-led at launch?** Plan currently assumes both — sandbox at `/signup`, paid via sales call. Confirm.
2. **First reference tenant?** Does TruVis itself become Tenant Zero, or do we onboard a friendly fintech / ADGM CSP first? Choice changes which vertical template ships first in Sprint 3.
3. **Pricing model.** Per-verification, per-seat, or hybrid? This drives metering plumbing in Sprint 3.13.
4. **goAML submission depth.** XML export (planned) is the safe answer. Direct goAML API submission requires each tenant's FIU credentials and likely regulator no-objection. Confirm: ship XML export only at v1?
5. **KSA scope at launch.** Yakeen/Absher/Tasdeeq adapters are deferred. Confirm we are UAE-first, KSA-when-pilot-asks.
6. **Arabic scope.** Customer-facing onboarding only (planned), or also operator/MLRO workbench? RTL on the workbench is non-trivial. Recommendation: customer-facing first; workbench defers until a tenant requests.
7. **SOC 2 Type I sponsor / auditor.** Need to pick now to start Sprint 3.12.
8. **First adverse media list.** ComplyAdvantage adverse media is a config flag; confirm we activate it as default-on for new tenants.

---

## 12. Bottom Line

- **What we have today is materially more than the older docs claim.** The platform already has 7 role dashboards, real IDV, SAR register with goAML export, working webhook queue, versioned tenant config, audit log, RLS everywhere, and a working marketing site.
- **The most urgent fix is removing competitor names from customer-facing copy.** That's a 1–2 day job and it's a brand/legal liability.
- **The biggest functional gap to a UAE pilot is i18n + UAE Pass + Emirates ID + adverse media + ongoing monitoring + UBO + EDD form.** Sprint 2 closes it.
- **The biggest gap to a public launch (anyone can sign up and use it) is the visual workflow builder, Web SDK, public API docs, sandbox signup, vertical templates, and SOC 2 Type I scoping.** Sprint 3 closes it.
- **Three sprints, ~10 weeks, and the platform is ready to sell.**

---

*Final Launch Plan v1.0 · 2026-05-01 · TruVis International Services · Internal · Confidential.*
