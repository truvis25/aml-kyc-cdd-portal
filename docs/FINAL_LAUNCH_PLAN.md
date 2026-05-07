# FINAL LAUNCH PLAN — TruVis AML/KYC/CDD Portal

> **Status:** Canonical planning document. Replaces `MVP_TODO.md`, `BUILD_ORDER.md`, `MILESTONE_1_PLAN.md`, `TASK_PACKS.md`, `PRD_VS_BUILT_GAP_ANALYSIS.md`. Supersedes the "what is built vs needed" sections of `ROLES_DASHBOARDS_FLOWS.md`.
> **Audience:** Product, Engineering, Compliance, Sales.
> **Date:** 2026-05-01.
> **Goal:** After completing the work in this plan, the platform is fit for SaaS sale and public launch in the UAE market.
> **Scope decisions locked (see §11 for full record):** UAE-only at launch · self-serve signup · hybrid pricing · goAML XML export only · Arabic UI deferred to v2 · KSA deferred to v2 · SOC 2 Type I via Drata + Prescient Assurance · adverse media default-ON.

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
   - **UAE Pass** identity bridge.
   - **Emirates ID** parse + validation hook.
   - **goAML XML** validated against the FIU XSD (we have a builder; we don't yet validate against the real schema).
   - **DFSA / FSRA / CBUAE rule packs** as selectable workflow templates.
   - **Ongoing monitoring (M-14)** — scheduled re-screening, doc expiry alerts.
   - **UBO engine (M-04)** — recursive resolution + tree visual.
   - **Adverse media** default-ON in screening adapter at conservative confidence threshold (85%+); tenant can adjust per workflow.

3. **Vendor-grade polish (gate to public self-serve launch):**
   - **Visual workflow builder** UI on top of our existing JSON schema.
   - **Web SDK** (drop-in iframe + JS lib) for tenants to embed customer onboarding.
   - **Public API docs** at `/docs/api` plus a sandbox tenant.
   - **SOC 2 Type I via Drata** + Prescient Assurance auditor (Type II at 12 months).
   - **Operational runbook** + monitoring (Sentry + log drain + alerts) live.
   - **Vertical packs** (Fintech, DNFBP, Real Estate, Crypto/VARA) shipped as templates.
   - **Self-serve signup → trial → paid** flow polished end-to-end (Nomod billing live; pricing page final).

We can ship #1 in days, #2 in 3–4 weeks, #3 in 4–6 weeks. **TruVis becomes Tenant Zero (dogfood) and a friendly UAE pilot is onboarded after #1 + #2.** Public self-serve signup opens to anyone after #3.

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

### 2.2 UAE-specific must-haves (from Vendor B's positioning)

| Surface | Feature | Status with us |
|---|---|---|
| Auth | UAE Pass identity bridge | **Missing — Sprint 2** |
| ID | Emirates ID parse + validation | **Missing — Sprint 2** (delegated to IDV but not surfaced as a first-class field) |
| FIU | goAML XML SAR/STR (XSD-validated) | Builder ✅; **XSD validation against real schema — Sprint 2** |
| Regulator | DFSA / FSRA / CBUAE rule packs | **Missing — Sprint 2** |
| Jurisdiction | DIFC / ADGM / mainland switch | **Missing — Sprint 2** (tenant config) |
| Residency | UAE region | Vercel `me1` (Bahrain) + Supabase region — done |
| Lang | Arabic UI + full RTL | **Deferred to v2** (decision §11.6) |
| KSA | Yakeen / Absher / Tasdeeq adapters | **Deferred to v2** (decision §11.5 — KSA PDPL data residency requires separate KSA region deployment) |

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
- **Public security page** — already exists; add SOC 2 Type I status (Drata in-progress badge), pen-test status, ISO 27001 roadmap, and a downloadable security overview PDF.
- **API docs** at `/docs/api` — autogenerated from Zod schemas + manual narrative.
- **Self-serve signup** at `/signup` — creates a 14-day trial tenant with synthetic seed data; upgrade to paid via Nomod.
- **Customer story page** structure (empty until first reference customer signs).
- **Trust badges line** — replace generic logos with real certifications + pending statuses ("SOC 2 Type I — in progress via Drata").
- **Pricing page** — final with 4 tiers per §11.3 (Starter / Growth / Scale / Enterprise); Enterprise routes to "request quote".

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
- `docs/RELEASE_CHECKLIST.md` — pre-deploy gate (typecheck, tests, db migration dry-run, smoke test).
- `docs/PRICING.md` — internal source of truth for tier definitions, metering rules, overage math, and how `tenant_billing` maps to pricing.

After cleanup the `docs/` folder is: `FINAL_LAUNCH_PLAN.md`, `MILESTONE_CHECKLISTS.md`, `ROLES_DASHBOARDS_FLOWS.md`, `RUNBOOK.md`, `DEPLOYMENT.md`, `TEST_SCENARIOS.md`, `SECURITY_OVERVIEW.md`, `API.md`, `RELEASE_CHECKLIST.md`, `PRICING.md`. Ten files, all current. (Arabic / `I18N.md` will be added in v2 when Arabic ships.)

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

### Sprint 2 — UAE must-haves + ongoing monitoring (3 weeks)

**Goal:** product is fit to onboard a UAE-licensed pilot tenant. SAR export validates against real FIU schema. Re-screening is alive. TruVis is live as Tenant Zero.

| # | Task | Owner |
|---|---|---|
| 2.1 | UAE Pass identity bridge (OIDC), surfaced as a customer-facing "Sign in with UAE Pass" path on onboarding | BE + FE |
| 2.2 | Emirates ID first-class field on individual KYC + parse helper | BE |
| 2.3 | goAML XSD validation in `goaml-builder.ts`; fixture-based tests against real FIU schema | BE |
| 2.4 | M-07 adverse media: enable in `complyadvantage` adapter; **default-ON at 85%+ confidence**; per-workflow override in admin config; new hit type surfaced in case UI | BE + FE |
| 2.5 | M-14 ongoing monitoring v1: pg_cron monthly re-screen of approved customers; doc-expiry alerts; new audit events; bundled with subscription (not metered) | BE + DB |
| 2.6 | M-04 UBO engine: recursive resolution, configurable threshold, simple tree visual on customer detail | BE + FE |
| 2.7 | M-06 EDD form: source of wealth, source of funds narrative, audited financials upload, surfaced when risk band is high+ | BE + FE |
| 2.8 | DFSA / FSRA / CBUAE rule packs as workflow templates in `admin-config` | BE |
| 2.9 | Hash-chained audit log per PRD §5.5 (add `prev_hash`, trigger, verification CLI) | DB |
| 2.10 | Implement test scenarios C-09 through C-16 + R-13 through R-21 + S-01 through S-13 | QA |
| 2.11 | **Tenant Zero**: stand up TruVis as our own first tenant; dogfood the onboarding + workbench end-to-end; capture findings as a punch list | PM + all |
| 2.12 | Friendly UAE pilot tenant identified, NDA/MSA signed, kickoff scheduled | Sales + PM |

**Ship gate:** TruVis (Tenant Zero) is using the platform internally. UAE pilot tenant can onboard a real customer via UAE Pass + Emirates ID, get screened including adverse media, route through risk + EDD if needed, and get a SAR exported in valid goAML XML if MLRO flags. Ongoing monitoring re-screens them at month-1.

### Sprint 3 — Self-serve launch readiness (4–6 weeks)

**Goal:** any prospect can self-serve a paid tenant in under 10 minutes, embed a Web SDK, configure workflows visually, and read public API docs. SOC 2 path is in motion.

| # | Task | Owner |
|---|---|---|
| 3.1 | Visual workflow builder UI (React Flow over existing JSON schema); sandbox preview | FE |
| 3.2 | Web SDK (drop-in iframe + JS lib) for the customer-facing onboarding flow | FE |
| 3.3 | Public API: version under `/v1`; OpenAPI spec generated from Zod; `/docs/api` page | BE + FE |
| 3.4 | **Self-serve signup** end-to-end: `/signup` → tenant + admin user + MFA setup + sample workflow + first invitation. 14-day trial sandbox tier auto-assigned; upgrade to paid via Nomod from `/admin/config`. | BE + FE |
| 3.5 | Vertical templates: Fintech, Corporate, Real Estate, DNFBP, Crypto/VARA | Product + BE |
| 3.6 | SLA tracking + breach alerts (email + dashboard widget) | BE + FE |
| 3.7 | Bulk case actions (assign, prioritize, close batch) | FE |
| 3.8 | Multi-stage / parallel approval paths (M-11 phase 2) | BE |
| 3.9 | Channel + Relationship dimensions in risk scoring (5-dim per PRD) | BE |
| 3.10 | Tenant-configurable risk weights with MLRO acknowledgement | BE + FE |
| 3.11 | Sentry, Vercel log drain, Supabase alerts wired | DevOps |
| 3.12 | **SOC 2 Type I via Drata**: account stood up, controls mapped, evidence-collection automation enabled across Supabase/Vercel/GitHub/AWS; auditor (Prescient Assurance) engaged; target Type I sign-off in ~3 months | Compliance |
| 3.13 | **Billing live (Nomod)**: 4 tiers wired (Starter / Growth / Scale / Enterprise — see §11.3); per-verification metering; invoice surface on `/admin/billing`; trial-to-paid upgrade flow; test charge on each tier | BE + FE |
| 3.14 | Performance test scenarios P-01 through P-05 | QA |
| 3.15 | Backup + restore test on production Supabase | DevOps |
| 3.16 | Operational runbook v1 reviewed with on-call team | PM |
| 3.17 | Pricing page final with 4 tiers; "request quote" CTA on Enterprise | Marketing + FE |

**Ship gate:** prospect signs up at `/signup`, completes MFA + tenant setup, embeds `<script src="…/sdk/v1.js">`, configures a workflow visually, runs a synthetic customer end-to-end, upgrades to a paid tier via Nomod, gets first invoice — without any TruVis support intervention. Sentry receives a test error and alerts. Backup restoration test passes. Drata is collecting evidence.

---

## 9. Sprint Backlog (one row per work item, ordered)

This is the queue. It's a flattened version of §8.

```
Sprint 1
S1-01  [x] Strip "Sumsub"/"Azakaw" from marketing surfaces (§6.1) — PR #82
S1-02  [x] Delete /compare/sumsub + /compare/azakaw, build generic /compare — PR #82
S1-03  [x] Dashboard improvements per §4 (all 7 dashboards) — PR #83
S1-04  [x] Empty + loading states audit for all list pages — PR #84
S1-05  Playwright harness + e2e scenarios (≥20)
S1-06  [x] Add pgTAP for screening_hits, risk_assessments, sar_reports, tenant_billing — PR #85
S1-07  Docs cleanup per §7 — delete stale + add new
S1-08  CI green: typecheck + lint + tests + check:pii + e2e

Sprint 2
S2-01  UAE Pass OIDC bridge end-to-end
S2-02  Emirates ID first-class field + parse helper
S2-03  goAML XSD validation against real FIU schema + fixture tests
S2-04  Enable adverse media in screening adapter (default-ON @ 85%); per-workflow override; new hit type UI
S2-05  Ongoing monitoring v1 (pg_cron re-screen + doc expiry)
S2-06  UBO engine: recursion + threshold + tree viz
S2-07  EDD form: source of wealth/funds, audited financials upload
S2-08  Rule packs: DFSA, FSRA, CBUAE as workflow templates
S2-09  Hash-chained audit log (prev_hash + trigger + CLI verify)
S2-10  Remaining test scenarios (C-09→C-16, R-13→R-21, S-01→S-13)
S2-11  Tenant Zero: stand up TruVis as first tenant; dogfood end-to-end
S2-12  Friendly UAE pilot tenant identified, NDA/MSA signed

Sprint 3
S3-01  Visual workflow builder (React Flow over JSON schema)
S3-02  Web SDK (iframe + JS lib) for customer onboarding
S3-03  Public API /v1 + OpenAPI spec + /docs/api
S3-04  Self-serve signup end-to-end (signup → MFA → tenant → sample workflow → trial)
S3-05  Vertical templates (Fintech, Corporate, Real Estate, DNFBP, Crypto)
S3-06  SLA tracking + breach alerts
S3-07  Bulk case actions
S3-08  Multi-stage / parallel approval paths
S3-09  5-dim risk scoring (add channel + relationship)
S3-10  Tenant-configurable risk weights with MLRO ack
S3-11  Sentry + log drain + Supabase alerts
S3-12  SOC 2 Type I via Drata + Prescient Assurance auditor engaged
S3-13  Billing live (Nomod): 4 tiers wired + metering + invoice surface
S3-14  Performance scenarios P-01→P-05
S3-15  Backup + restore test on prod
S3-16  Runbook v1 review with on-call team
S3-17  Pricing page final with 4 tiers; Enterprise "request quote" CTA
```

---

## 10. Pre-Sale Readiness Checklist

Tick every box before quoting a paying customer.

### 10.1 Product
- [ ] All Sprint 1 + Sprint 2 ship gates met
- [ ] At least 90% of test scenarios in §5 passing on staging
- [ ] No `TODO`, `FIXME`, or commented-out code in `modules/` or `app/api/`
- [ ] Branding: tenant can upload logo, set primary color, customize email "from" name
- [x] No competitor name appears anywhere in customer-facing copy

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

## 11. Decisions (locked 2026-05-01)

All open questions resolved. This section is the durable record.

### 11.1 Go-to-market posture — **self-serve only at launch**

Public `/signup` creates a 14-day trial tenant. Trial converts to a paid tier from inside the platform via Nomod. No sales-led path for v1 (Enterprise quotes route through "request quote" but are still onboarded via the same self-serve flow with a coupon). Implication: Sprint 3 must polish signup → MFA → tenant-setup → workflow-config → first-customer flow to a 10-minute, no-support-needed experience.

### 11.2 First tenants — **TruVis (Tenant Zero) + one friendly UAE pilot**

TruVis becomes its own first tenant in Sprint 2 (dogfood). A friendly UAE pilot tenant is identified and signed in parallel — used for the Sprint 2 ship-gate validation. First vertical template to ship in Sprint 3 = the pilot's industry.

### 11.3 Pricing — **Hybrid (subscription + metered verifications)**

| Tier | Base / month | Included verifications | Overage | Seats | Notes |
|---|---|---|---|---|---|
| Starter | AED 1,500 | 100 | AED 15 / verification | 3 | Self-serve trial converts here |
| Growth | AED 4,500 | 500 | AED 12 / verification | 10 | Default for fintechs |
| Scale | AED 12,000 | 2,000 | AED 9 / verification | unlimited | Regulated FIs, mid-size |
| Enterprise | custom | custom | custom | custom | Banks, multi-jurisdiction |

A "verification" = one completed Individual KYC OR one completed Corporate KYB. Ongoing-monitoring re-screens are bundled in the subscription (not metered) so customers get predictable cost. Adverse-media hits are not separately metered. Internal source of truth for tier math: `docs/PRICING.md` (Sprint 3).

### 11.4 goAML — **XML export only at v1**

MLRO clicks "Export goAML XML" on a SAR-flagged case → file validated against the FIU XSD → downloaded for manual upload to goAML portal. No direct API submission in v1 (avoids per-tenant FIU credential management and regulator no-objection process).

### 11.5 KSA — **deferred to v2**

Two hard blockers: (a) KSA PDPL 2023 requires personal data of Saudi residents to be processed in KSA; we run on Vercel `me1` (Bahrain) + Supabase, which doesn't satisfy this. (b) SAMA AML rules effectively require Arabic-primary UI for KSA-licensed FIs; Arabic is also deferred (§11.6). Yakeen / Absher / Tasdeeq adapters are not built. KSA goes on the v2 roadmap as a parallel deployment with KSA-region infrastructure.

### 11.6 Arabic / RTL — **deferred to v2**

Not in v1. Onboarding, workbench, and marketing all ship English-only at v1. Reconsider after a paying tenant explicitly asks for Arabic. When we do build it, scope is customer-facing onboarding first (Sprint v2.x); workbench RTL only if a tenant requires it.

### 11.7 SOC 2 Type I — **Drata + Prescient Assurance**

Drata as the compliance-as-code platform (best fit for Supabase/Vercel/GitHub stack; ~80% of evidence collection automated). Prescient Assurance as the auditor (Drata partner, accepts Drata evidence directly). Target: Type I sign-off in ~3 months from Sprint 3.12 kickoff. Type II follows on a 12-month observation window. Estimated cost: ~USD 12–15k/year Drata + ~USD 15–20k Type I audit fee.

### 11.8 Adverse media — **default-ON at 85%+ confidence threshold**

Enabled by default for new tenants in the screening adapter. Match confidence threshold defaults to 85% so analyst hit-volume stays manageable. Tenant admin can lower the threshold (more hits, more sensitive) or disable adverse media per workflow. Surfaced as a distinct hit type in case UI alongside sanctions/PEP.

---

## 12. Bottom Line

- **What we have today is materially more than the older docs claim.** The platform already has 7 role dashboards, real IDV, SAR register with goAML export, working webhook queue, versioned tenant config, audit log, RLS everywhere, and a working marketing site.
- **The most urgent fix is removing competitor names from customer-facing copy.** That's a 1–2 day job and it's a brand/legal liability.
- **The biggest functional gap to a UAE pilot is UAE Pass + Emirates ID + adverse media + ongoing monitoring + UBO + EDD form.** Sprint 2 closes it (~3 weeks).
- **The biggest gap to public self-serve launch is the visual workflow builder, Web SDK, public API docs, polished signup, vertical templates, billing live, and SOC 2 Type I in motion via Drata.** Sprint 3 closes it (~4–6 weeks).
- **Three sprints, ~8–10 weeks, and the platform is ready for self-serve public launch in the UAE market.** Arabic and KSA follow in v2.

---

*Final Launch Plan v1.0 · 2026-05-01 · TruVis International Services · Internal · Confidential.*
