# Roles, Dashboards, Policies & Flows

Source of truth for what each platform role is, what they see, what they can do, and how cases move between them. This document drives all UI and API development decisions.

---

## 1. The Seven Roles

| Role | Who they are | MFA | Scope |
|------|-------------|-----|-------|
| `platform_super_admin` | TruVis infrastructure admin. Manages tenants, not compliance. Cannot see customer PII. | Required | Cross-tenant |
| `tenant_admin` | Bank/VASP compliance operations lead. Full control within their tenant. | Required | Single tenant |
| `mlro` | Money Laundering Reporting Officer. Chief compliance authority. Terminal decision-maker on all high-risk cases. Only role that can flag SARs. | Required | Single tenant |
| `senior_reviewer` | Compliance officer. Approves and rejects standard-risk cases. Escalates high-risk to MLRO. | Optional | Assigned cases |
| `analyst` | First-line reviewer. Verifies documents, resolves screening hits, adds notes, requests info, escalates up. Cannot make final decisions. | Optional | Assigned cases |
| `onboarding_agent` | Front-office staff who assists customers through onboarding. Creates sessions, uploads documents on their behalf. | Not required | Own sessions |
| `read_only` | Compliance/reporting viewer. Sees aggregate metrics only. Zero PII access. | Not required | Aggregate only |

---

## 2. Dashboards — What Each Role Sees

Each role must land on a **role-specific dashboard** after login. One generic dashboard for all roles is wrong. Below defines the exact widgets/panels each dashboard must show.

---

### 2.1 Platform Super Admin Dashboard
**URL:** `/dashboard` (redirected to `/admin/platform`)  
**Purpose:** Health and governance of the entire platform across all tenants.

| Widget | Data |
|--------|------|
| Tenant Registry | Total tenants, active/inactive count, newest tenant |
| Per-Tenant Health | Tenant name, open cases count, active sessions, last activity |
| System Events | Recent platform-level audit events (tenant created, config changed) |
| User Totals | Staff count across all tenants |

**Nav items:** Platform Admin, All Tenants, Platform Audit Log  
**No access to:** Customer PII, case content, individual tenant compliance data

---

### 2.2 Tenant Admin Dashboard
**URL:** `/dashboard`  
**Purpose:** Operational control of the tenant — team, config, workflow status, and a health overview.

| Widget | Data |
|--------|------|
| Team Overview | Active users count, pending invites, quick "Invite User" action |
| Workflow Status | Active workflow version, last activated by/when, "Manage Workflows" link |
| Onboarding Volume | New sessions today / this week / this month |
| Case Health | Open cases, avg days to decision, unassigned cases count |
| Config Completeness | Checklist: documents configured, branding set, risk thresholds set |

**Nav items:** Dashboard, Cases, Customers, Admin (Users / Config / Workflows), Audit Log  
**Quick actions:** Invite User, Start Onboarding, View All Cases

---

### 2.3 MLRO Dashboard
**URL:** `/dashboard`  
**Purpose:** Daily compliance oversight. Primary focus is high-risk queue, SAR status, and compliance posture.

| Widget | Data |
|--------|------|
| High-Risk Queue | Cases in `high_risk` and `unacceptable` queues — count + oldest open date |
| SAR Flagged Cases | Cases currently flagged as SAR — count, link to SAR register |
| Escalated to Me | Cases escalated to MLRO in last 7 days |
| Screening Hits | Unresolved screening hits across all cases |
| Risk Distribution | Chart: how many cases in each risk band (low/medium/high/unacceptable) this month |
| 30-Day Volume | Approved / Rejected / Pending trend line |
| Pending Approvals | Cases in `in_review` status assigned to MLRO, sorted by age |

**Nav items:** Dashboard, Cases (all queues), Customers (all), SAR Register, Audit Log, Reporting  
**Quick actions:** View High-Risk Queue, Export Audit Log, View SAR Register

---

### 2.4 Senior Reviewer Dashboard
**URL:** `/dashboard`  
**Purpose:** Personal workload management. Cases assigned to them, approvals pending, escalations received.

| Widget | Data |
|--------|------|
| My Open Cases | Count of cases assigned to me, status breakdown |
| Awaiting My Decision | Cases in `in_review` status assigned to me |
| Escalated to Me | Recently escalated cases (from analysts) |
| Overdue | Cases open > 5 business days |
| Recently Closed | Last 5 decisions made by this user |

**Nav items:** Dashboard, My Cases, Customers (assigned)  
**Quick actions:** Go to My Queue, View Overdue Cases

---

### 2.5 Analyst Dashboard
**URL:** `/dashboard`  
**Purpose:** Daily task list. Documents to verify, hits to resolve, cases to work.

| Widget | Data |
|--------|------|
| My Cases | Count of open cases assigned to me |
| Documents to Verify | Uploaded but unverified docs on my cases |
| Screening Hits to Resolve | Unresolved hits on my cases |
| Cases Pending Info | My cases in `pending_info` — waiting on customer |
| Recently Completed | Last 5 cases I worked (closed/escalated) |

**Nav items:** Dashboard, My Cases, Customers (assigned)  
**Quick actions:** Start Onboarding (if permitted), Go to My Queue

---

### 2.6 Onboarding Agent Dashboard
**URL:** `/dashboard`  
**Purpose:** Session management. Start new onboardings, track in-progress sessions, handle re-submissions.

| Widget | Data |
|--------|------|
| Active Sessions | Count of in-progress sessions I created today |
| Start New Onboarding | Buttons: Individual KYC / Corporate KYB |
| My Recent Sessions | Last 10 sessions with customer name, status, last step |
| Stuck Sessions | Sessions in `pending_info` older than 48 hours |
| Completed Today | Sessions I completed today |

**Nav items:** Dashboard, New Onboarding, My Sessions  
**Quick actions:** New Individual KYC, New Corporate KYB, Customer Lookup

---

### 2.7 Read Only Dashboard
**URL:** `/dashboard`  
**Purpose:** Aggregate reporting. No PII. No case detail. Compliance and business metrics only.

| Widget | Data |
|--------|------|
| Monthly Onboarding Volume | Applications received / completed / abandoned |
| Approval Rate | % approved, rejected, pending — by month |
| Avg Time to Decision | Days from session start to case close, by risk band |
| Risk Band Distribution | Pie: % low / medium / high / unacceptable |
| Document Rejection Reasons | Aggregate: most common doc rejection types |
| Screening Hit Rate | % of cases that had ≥1 screening hit |

**Nav items:** Dashboard, Reporting  
**No access to:** Cases, Customers, Audit Log detail, Admin

---

## 3. Navigation Policy — Who Sees What in the Sidebar

| Nav Item | super_admin | tenant_admin | mlro | senior_reviewer | analyst | onboarding_agent | read_only |
|----------|:-----------:|:------------:|:----:|:---------------:|:-------:|:----------------:|:---------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cases | ❌ | ✅ (all) | ✅ (all) | ✅ (assigned) | ✅ (assigned) | ❌ | ❌ |
| SAR Register | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Customers | ❌ | ✅ (all) | ✅ (all) | ✅ (assigned) | ✅ (assigned) | ❌ | ❌ |
| New Onboarding | ❌ | ✅ | ❌ | ❌ | ✅* | ✅ | ❌ |
| Admin / Users | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin / Config | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin / Workflows | ❌ | ✅ | ✅ (view only) | ❌ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reporting | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Platform Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Analyst can initiate onboarding if `onboarding:create` permission is granted explicitly.

---

## 4. Case Flow Policy

This is the core compliance workflow. All cases originate from the risk engine after onboarding completes.

```
Customer completes onboarding
         │
         ▼
  Risk Engine scores
         │
  ┌──────┴──────────────────────────────────┐
  │                                         │
  ▼ score ≤ 30                              ▼ score 31–100
LOW → Auto-approve                    Case opened
(no human review)                          │
                          ┌────────────────┼────────────────┐
                          │                │                │
                     score 31–60      score 61–80      score >80
                       MEDIUM           HIGH          UNACCEPTABLE
                          │                │                │
                          ▼                ▼                ▼
                    Analyst queue   Senior Reviewer     MLRO queue
                                       queue
```

### Case Statuses

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| `open` | Newly created, unassigned | System (auto) |
| `in_review` | Assigned and being worked | Analyst / SR / MLRO |
| `pending_info` | Waiting for customer to provide more info | Analyst / SR / MLRO |
| `escalated` | Escalated to next tier | Analyst / SR |
| `approved` | Final approval granted | SR (standard) / MLRO (high-risk) / Tenant Admin |
| `rejected` | Final rejection | SR / MLRO / Tenant Admin |
| `closed` | Terminal state (approved or rejected + notifications sent) | System |

### Case Queues

| Queue | Risk Band | Initial Reviewer |
|-------|-----------|-----------------|
| `low` | ≤30 | Auto (no reviewer) |
| `medium` | 31–60 | Analyst |
| `high` | 61–80 | Senior Reviewer |
| `unacceptable` | >80 | MLRO |
| `sar` | Any + SAR flagged | MLRO |

---

## 5. Role Action Matrix

What each role can **do** on a case, not just see.

| Action | tenant_admin | mlro | senior_reviewer | analyst |
|--------|:-----------:|:----:|:---------------:|:-------:|
| Read all cases | ✅ | ✅ | ❌ | ❌ |
| Read assigned cases only | ✅ | ✅ | ✅ | ✅ |
| Assign case to reviewer | ✅ | ✅ | ✅ | ❌ |
| Add note | ✅ | ✅ | ✅ | ✅ |
| Request additional info (RAI) | ✅ | ✅ | ✅ | ✅ |
| Escalate | ✅ | ✅ | ✅ | ✅ |
| Verify document | ✅ | ✅ | ✅ | ✅ |
| Resolve screening hit | ✅ | ✅ | ✅ | ✅ |
| Approve (standard risk) | ✅ | ✅ | ✅ | ❌ |
| Approve (high risk) | ✅ | ✅ | ❌ | ❌ |
| Reject | ✅ | ✅ | ✅ | ❌ |
| Flag SAR | ✅ | ✅ | ❌ | ❌ |
| View SAR status | ✅ | ✅ | ❌ | ❌ |
| View EDD data | ✅ | ✅ | ✅ | ❌ |
| Read audit log | ✅ | ✅ | ❌ | ❌ |
| Export audit log | ✅ | ✅ | ❌ | ❌ |

---

## 6. Escalation Flow

```
Analyst
  │
  │ can escalate to ──────────────────┐
  │                                   │
  ▼                                   ▼
Senior Reviewer ──── can escalate ──► MLRO
  │ (can approve standard)             │
  │                              (approves all,
  │                              flags SAR,
  │                              terminal authority)
  ▼
Case Closed (approved/rejected)
```

Escalation rules:
- **Analyst** can escalate to Senior Reviewer OR MLRO directly
- **Senior Reviewer** can escalate to MLRO only
- **MLRO** cannot escalate — MLRO is the terminal reviewer
- Escalation creates an immutable `case_events` record
- Escalation changes `queue` to the next tier's queue
- Escalated cases re-appear in the new reviewer's queue

---

## 7. SAR (Suspicious Activity Report) Flow

```
MLRO reviews case
     │
     ├── Identifies suspicious activity
     │
     ▼
MLRO flags SAR toggle (cases:flag_sar)
     │
     ▼
Case moves to `sar` queue
Audit event: "sar_flagged" (immutable)
     │
     ▼
SAR Register entry created
     │
     ├── MLRO can add SAR notes (privileged)
     ├── Case remains open pending regulatory decision
     │
     ▼
MLRO makes final decision:
  - Approve with conditions
  - Reject (file SAR externally)
  - Close as false positive (unflag SAR)
     │
     ▼
Audit event: "sar_resolved"
Case closed
```

SAR visibility: Only `mlro` and `tenant_admin` can see SAR status. Analysts and Senior Reviewers are intentionally blind to SAR flags (tipping-off prevention).

---

## 8. Request Additional Info (RAI) Flow

```
Reviewer decides more info needed
     │
     ▼
RAI action on case
  - Enter required info description
  - Select required document types (optional)
     │
     ▼
Case status → `pending_info`
Email sent to customer via Resend
Audit event: "additional_info_requested"
     │
     ▼
Customer receives email with link to status portal
Customer uploads additional docs / updates data
     │
     ▼
Case status → `in_review` (auto on new submission)
Audit event: "additional_info_received"
Reviewer notified (in-app + optional email)
```

---

## 9. End-to-End Customer Journey (Individual KYC)

```
Step 1: Customer arrives at /{tenantSlug}/onboard
Step 2: Selects "Individual"
Step 3: Session created (onboarding_sessions)
Step 4: Consent form → consent_records (immutable)
Step 5: Identity form → customers + customer_data_versions
Step 6: PEP declaration → if YES, pep_flag = true on customer
Step 7: Document upload → Supabase Storage + documents record
Step 8: IDV initiated (Sumsub) [NOT YET IMPLEMENTED]
Step 9: Session marked complete
Step 10: Risk engine → risk_assessments created
Step 11: Screening initiated (ComplyAdvantage)
Step 12: If screening hits → unresolved hits block case progression
         - Hits must be resolved by analyst before case can close
Step 13: Case auto-created → routed to correct queue by risk_band
Step 14: Reviewer assigned → reviews all tabs (customer, docs, screening, risk, timeline)
Step 15: Reviewer makes decision
Step 16: Customer notified by email [NOT YET IMPLEMENTED]
Step 17: Case closed
```

---

## 10. Admin Workflow (Tenant Setup)

```
Platform Super Admin creates tenant
     │
     ▼
Tenant Admin invited (email)
     │
     ▼
Tenant Admin logs in + sets up MFA
     │
     ├── Invites MLRO
     ├── Invites Senior Reviewers + Analysts
     ├── Configures required document types
     ├── Sets risk thresholds (or uses defaults)
     ├── Uploads branding (optional)
     ▼
MLRO reviews and acknowledges workflow definition
     │
     ▼
Tenant Admin activates workflow
     │
     ▼
Onboarding link published to customers
/{tenantSlug}/onboard is live
```

---

## 11. Current Build State vs Required

### What Is Complete ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (email + password) | ✅ Done | |
| TOTP MFA | ✅ Done | Required for admin/mlro |
| RBAC (7 roles, permissions matrix) | ✅ Done | |
| Audit log (immutable, hash chain) | ✅ Done | |
| RLS on all tables | ✅ Done | |
| JWT enrichment (Postgres hook) | ✅ Done | |
| Customer onboarding flow (individual) | ✅ Done | |
| Corporate KYB form | ✅ Done | |
| Consent capture | ✅ Done | |
| Document upload (signed URLs) | ✅ Done | |
| Risk scoring (3 dimensions) | ✅ Done | |
| Screening (ComplyAdvantage adapter) | ✅ Done | |
| Case management (open, assign, events) | ✅ Done | |
| Analyst actions (note, RAI, escalate) | ✅ Done | |
| Approval recording (SR + MLRO) | ✅ Done | |
| SAR flag toggle | ✅ Done | |
| Document verification (analyst) | ✅ Done | |
| Case detail page (all tabs) | ✅ Done | |
| Audit log viewer + export | ✅ Done | |
| User management (invite, roles) | ✅ Done | |
| Workflow activate/deactivate | ✅ Done | |
| Basic dashboard (generic, stats) | ✅ Done | |

---

### What Needs to Be Built 🔴 (Blockers) 🟡 (High Priority) 🟢 (Medium)

#### 🔴 BLOCKERS — Must build before any production use

| Feature | What to Build |
|---------|---------------|
| **Role-specific dashboards** | 7 separate dashboard views. Current generic dashboard shows same stats to all roles. Each role needs its own metrics, queue summaries, and quick actions. |
| **IDV Integration (Sumsub)** | `kyc_results` table, `/api/kyc/[id]/initiate` endpoint, `process-idv-webhook` Edge Function, Sumsub SDK. Without this, KYC compliance is incomplete. |
| **Edge Functions directory** | `/supabase/functions/` does not exist. Need: `compute-document-hash`, `process-idv-webhook`, `process-screening-webhook`, `retry-failed-webhooks`. |
| **Webhook queue + retry** | `webhook_events` table, status tracking (queued/processing/failed/dead_letter), retry with exponential backoff, pg_cron hourly job. |
| **SAR Register page** | `/sar` page for MLRO and Tenant Admin. Lists all SAR-flagged cases with notes, dates, current status. Separate from the main case queue. |

#### 🟡 HIGH PRIORITY — Must build before pilot customers

| Feature | What to Build |
|---------|---------------|
| **Email notifications (Resend)** | RAI notifications to customer, approval/rejection emails, invitation emails. Stub currently exists but no actual sending. |
| **Realtime case queue** | Supabase Realtime subscription on `cases` table so new cases appear without page refresh. |
| **MLRO workflow acknowledgement** | Server-side enforcement that MLRO must acknowledge before Tenant Admin can activate a workflow. Currently UI-only, no server check. |
| **Reporting page** | `/reporting` page for read_only, reporting-capable roles. Aggregate metrics, no PII. Monthly volume, approval rates, avg time-to-decision. |
| **Admin config — complete** | Current admin config shows only tenant name. Missing: required document types config, risk threshold display, branding/logo upload, approval chain config. |
| **Customer detail — complete** | `/customers/[id]` exists but needs EDD section (visible only to MLRO + Senior Reviewer), full version history, and linked cases list. |
| **Tenant config versioning** | Replace `tenants.settings` JSONB with proper versioned `tenant_config` table. Needs audit trail for config changes. |

#### 🟢 MEDIUM PRIORITY — Should build before public launch

| Feature | What to Build |
|---------|---------------|
| **Workflow version history UI** | Show previous workflow versions in admin, who activated each, when, with MLRO acknowledgement record. |
| **PII masking utility** | `sanitise()` function that masks PII in logs. Automated CI scan for raw PII in log statements. |
| **pgTAP test suite expansion** | Tests for screening, risk, cases, approvals — cross-tenant isolation attempts. Currently only 4 basic tests. |
| **Case assignment notifications** | In-platform notification (badge) when a case is assigned to you. |
| **Pagination on all lists** | Cases, customers, and audit log pages are capped at 50. Need proper cursor-based pagination. |
| **Monitoring setup** | Sentry for error tracking, Vercel log drain, Supabase DB alerts. |
| **Production deployment** | Supabase production project, Vercel production config, environment variable management. |

---

## 12. Development Priority Order

Build in this sequence for end-to-end functionality:

```
Phase 1 — Dashboards & Navigation (this sprint)
  1. Role-specific dashboard pages (7 views)
  2. Role-adaptive sidebar navigation
  3. SAR Register page (MLRO)
  4. Reporting page (read_only + mlro)

Phase 2 — Missing Core Infrastructure
  5. Webhook queue (webhook_events table + API)
  6. Edge Functions (compute-document-hash, process-screening-webhook)
  7. Resend email integration (RAI, approval, rejection)
  8. Realtime case queue subscription

Phase 3 — Compliance Completeness
  9. IDV Integration (Sumsub)
  10. MLRO workflow acknowledgement (server-enforced)
  11. Tenant config versioning + complete admin config UI
  12. Customer detail EDD section

Phase 4 — Hardening & Launch
  13. PII masking utility + CI scan
  14. pgTAP full test suite
  15. Monitoring (Sentry, log drain)
  16. Production deployment + runbook
```

---

## 13. Pages Inventory — Final Target State

### Auth Routes (public)
| Route | Status |
|-------|--------|
| `/sign-in` | ✅ Done |
| `/mfa-setup` | ✅ Done |
| `/forgot-password` | ✅ Done |
| `/reset-password` | ✅ Done |

### Platform Routes (authenticated)
| Route | Status | Role Access |
|-------|--------|-------------|
| `/dashboard` — role-specific | 🔴 Generic only | All |
| `/cases` | ✅ Done | Admin, MLRO, SR, Analyst |
| `/cases/[id]` | ✅ Done | Admin, MLRO, SR, Analyst |
| `/customers` | ✅ Done | Admin, MLRO, SR, Analyst |
| `/customers/[id]` | 🟡 Needs EDD, history | Admin, MLRO, SR, Analyst |
| `/sar` | 🔴 Not built | Admin, MLRO only |
| `/reporting` | 🔴 Not built | Admin, MLRO, SR, Read Only |
| `/audit` | ✅ Done | Admin, MLRO |
| `/admin/users` | ✅ Done | Admin only |
| `/admin/config` | 🟡 Minimal | Admin only |
| `/admin/workflows` | 🟡 Missing version history | Admin (+ MLRO acknowledge) |
| `/admin/platform` | 🔴 Not built | Platform Super Admin only |

### Onboarding Routes (customer-facing)
| Route | Status |
|-------|--------|
| `/[tenantSlug]/onboard` | ✅ Done |
| `/[tenantSlug]/onboard/[id]/consent` | ✅ Done |
| `/[tenantSlug]/onboard/[id]/identity` | ✅ Done |
| `/[tenantSlug]/onboard/[id]/business` | ✅ Done |
| `/[tenantSlug]/onboard/[id]/documents` | ✅ Done |
| `/[tenantSlug]/onboard/[id]/idv` | 🔴 Not built — Sumsub widget |
| `/[tenantSlug]/onboard/[id]/complete` | ✅ Done |
| `/[tenantSlug]/status/[id]` | ✅ Done |
