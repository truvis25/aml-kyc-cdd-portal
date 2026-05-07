# Test Scenarios — AML/KYC/CDD Portal

> Source: `docs/FINAL_LAUNCH_PLAN.md` §5  
> Updated as scenarios pass on staging; target: ≥90% passing before pre-sale readiness.  
> Framework: Vitest (unit), Playwright (e2e), pgTAP (DB).  
> Classification: Internal · Confidential · TruVis International Services

---

## §5.1 Customer Journeys

| ID | Scenario | Expected Outcome | Status |
|---|---|---|---|
| C-01 | Happy path individual KYC, low risk | Auto-approved, no case created, customer email sent | pending |
| C-02 | Individual KYC, medium risk | Case routed to Analyst queue | pending |
| C-03 | Individual KYC, high risk | Case routed to Senior Reviewer queue | pending |
| C-04 | Individual KYC, unacceptable risk | Case routed to MLRO queue | pending |
| C-05 | Corporate KYB, all UBOs identified | Each UBO gets KYC sub-flow; entity case created | pending |
| C-06 | Session abandoned mid-flow | Resumable from saved step on return | pending |
| C-07 | Consent declined | No data captured; session terminated; audit event | pending |
| C-08 | Document upload + hash | `documents` row created; hash populated within 10s | pending |
| C-09 | IDV liveness fail | Result stored; case routed to manual review | pending |
| C-10 | IDV duplicate webhook | Idempotent — single `kyc_results` row | pending |
| C-11 | Screening hit (false positive) | Analyst resolves; case proceeds | pending |
| C-12 | Screening hit (true match) | Escalated to MLRO; case stays open | pending |
| C-13 | PEP self-declaration true | EDD path triggered; MLRO involved | pending |
| C-14 | RAI issued | Customer email sent; status `pending_info`; resume → status `in_review` | pending |
| C-15 | Customer rejection | Email sent (tipping-off-safe wording); case closed; immutable | pending |
| C-16 | Re-onboarding existing customer | Treated as new session; new versioned data row | pending |

---

## §5.2 Role Workflows

| ID | Role | Action | Expected | Status |
|---|---|---|---|---|
| R-01 | Platform Super Admin | Create tenant via /admin/platform | Tenant + admin invite + audit event | pending |
| R-02 | Tenant Admin | Invite user with role | Email sent; user activates; correct role assigned | pending |
| R-03 | Tenant Admin | Activate workflow without MLRO ack | Server blocks (403); audit event | pending |
| R-04 | Tenant Admin | Edit branding | Logo appears on `/{tenantSlug}/onboard` | pending |
| R-05 | Tenant Admin | Edit risk thresholds | New `tenant_config` version; audit event | pending |
| R-06 | MLRO | Acknowledge workflow version | `workflow_activation_acks` row; admin can now activate | pending |
| R-07 | MLRO | Flag SAR on a case | Audit event; case appears in `/sar`; analyst/SR cannot see flag | pending |
| R-08 | MLRO | Export goAML XML for SAR | Valid XML file (against FIU XSD) | pending |
| R-09 | MLRO | Approve high-risk case | Approval recorded immutably; audit event | pending |
| R-10 | MLRO | Open audit log + filter by customer | Returns full chronology; export JSON-L works | pending |
| R-11 | Senior Reviewer | Approve standard-risk case | Approval recorded; case closed | pending |
| R-12 | Senior Reviewer | Escalate to MLRO | Queue switched; MLRO sees it | pending |
| R-13 | Analyst | Verify document | `documents.verification_status` updated; audit event | pending |
| R-14 | Analyst | Resolve screening hit | `screening_hit_resolutions` row; immutable | pending |
| R-15 | Analyst | Add internal note | Note saved as case event; immutable | pending |
| R-16 | Analyst | Request additional info | Email sent; status `pending_info` | pending |
| R-17 | Analyst | Try to approve high-risk case | Blocked by RBAC (403) | pending |
| R-18 | Onboarding Agent | Start individual onboarding for walk-in | Session created in agent's name | pending |
| R-19 | Onboarding Agent | Resume stuck session | Picks up at correct step | pending |
| R-20 | Read-Only | View reporting dashboard | Aggregate metrics only; no PII anywhere | pending |
| R-21 | Read-Only | Try to access /cases | Blocked by middleware | pending |

---

## §5.3 Cross-Cutting & Security

| ID | Scenario | Expected | Status |
|---|---|---|---|
| S-01 | Cross-tenant JWT attempt on /cases/[id] | 403 (proxy + RLS double gate) | pending |
| S-02 | Service-role import in `app/` | Build/CI fail (lint guard) | pending |
| S-03 | UPDATE on `audit_log` | Postgres exception | pending |
| S-04 | DELETE on `audit_log` | Postgres exception | pending |
| S-05 | Signed URL TTL > 15 min | Reject | pending |
| S-06 | Bare UPDATE on customer PII fields | Blocked; must go through `customer_data_versions` | pending |
| S-07 | Webhook retries on transient failure | Exponential backoff via pg_cron; reaches `processed` | pending |
| S-08 | Webhook permanently failing | Lands in `dead_letter` after N retries | pending |
| S-09 | PII in any application log | `npm run check:pii` fails CI | pending |
| S-10 | Cross-tenant Realtime subscription | Receives nothing (RLS) | pending |
| S-11 | Cross-tenant signed URL fetch | 403 | pending |
| S-12 | MLRO without MFA visiting /sar | Redirect to /mfa-setup | pending |
| S-13 | New user invited then deactivated | Cannot sign in; existing sessions revoked | pending |

---

## §5.4 Performance / Scale

| ID | Scenario | Expected | Status |
|---|---|---|---|
| P-01 | 50 concurrent onboarding sessions | No degradation; no row-level lock contention | pending |
| P-02 | Cases page with 5,000 records | First page renders < 1.5s; pagination correct | pending |
| P-03 | Audit log with 1M rows, customer-id filter | < 1s with index; export < 30s | pending |
| P-04 | Document upload 50MB | Direct-to-Storage; no proxy through API | pending |
| P-05 | Realtime subscription with 200 watchers | No dropped events | pending |

---

*Sprint 1 target: C-01→C-08, R-01→R-12 passing (Playwright e2e harness). Sprint 2: remainder of C, R, S scenarios. Sprint 3: P scenarios.*
