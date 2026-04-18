# AML/KYC/CDD Portal — Claude Code Task Packs
> Source of truth: PRD v1.0 + Development Plan v1.0 · TruVis International Services
> Classification: Internal · Confidential · 2026
>
> Each task pack is a self-contained Claude Code session brief.
> Copy the relevant pack into a new Claude Code session to execute that milestone.

---

## TASK PACK 1 — Milestone 1: Foundation

### Exact Scope
Build the security and compliance backbone. No customer data flows until this is complete.

### Non-Goals (do NOT build)
- Any onboarding UI or flow
- Consent forms
- KYC data collection
- Documents
- Screening or risk scoring
- Case management
- Admin configuration UI

### Context
- Stack: Next.js 16 App Router, TypeScript (strict), Tailwind CSS, shadcn/ui, Zod
- Database: Supabase Postgres (shared schema + RLS)
- Auth: Supabase Auth (email+password + TOTP MFA)
- Hosting: Vercel (App Router deployment)
- Monorepo structure per DevPlan Section 10
- All migrations go in `supabase/migrations/` numbered sequentially

### File Targets

**New files to create:**
```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts
middleware.ts
supabase/config.toml
supabase/migrations/0001_create_tenants.sql
supabase/migrations/0002_create_users_roles.sql
supabase/migrations/0003_create_audit_log.sql
supabase/migrations/0004_audit_triggers.sql
supabase/seed/roles.sql
supabase/seed/test-tenant.sql
supabase/functions/enrich-jwt/index.ts
app/layout.tsx
app/page.tsx
app/(auth)/sign-in/page.tsx
app/(auth)/mfa-setup/page.tsx
app/(platform)/layout.tsx
app/(platform)/dashboard/page.tsx
app/(platform)/admin/users/page.tsx
app/api/admin/users/invite/route.ts
modules/audit/audit.service.ts
modules/audit/audit.types.ts
modules/auth/auth.service.ts
modules/auth/rbac.ts
modules/auth/auth.types.ts
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/admin.ts
lib/constants/roles.ts
lib/constants/events.ts
components/shared/navigation.tsx
components/shared/sidebar.tsx
components/shared/auth-forms.tsx
components/ui/  ← shadcn/ui base components
.env.example
CLAUDE.md  ← update with stack decisions
```

### Migrations to Create

**0001_create_tenants.sql**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated users read own tenant only
-- Platform super-admin reads all (via service role bypass)
```

**0002_create_users_roles.sql**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  display_name TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ  -- NULL = active; non-NULL = revoked
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

**0003_create_audit_log.sql**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  actor_id UUID,  -- NULL for system events
  actor_role TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  session_id UUID,
  ip_address INET,
  prev_hash TEXT,
  row_hash TEXT  -- computed SHA-256
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- GRANT INSERT on audit_log TO authenticated;
-- NO UPDATE grant. NO DELETE grant.
```

**0004_audit_triggers.sql**
```sql
-- Trigger: prevent any modification of audit_log
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_audit_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER no_audit_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Generic audit trigger function for other tables
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, event_type, entity_type, entity_id, payload)
  VALUES (
    NEW.tenant_id,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(NEW)::JSONB
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Modules to Touch
- `modules/audit/` — audit.service.ts, audit.types.ts (create)
- `modules/auth/` — auth.service.ts, rbac.ts, auth.types.ts (create)
- `lib/supabase/` — client.ts, server.ts, admin.ts (create)
- `lib/constants/` — roles.ts, events.ts (create)

### APIs to Implement
- `POST /api/admin/users/invite` — Tenant Admin invites a new user; creates user_roles row
- *(Supabase Auth handles sign-in, email verification, MFA via client SDK)*

### UI Routes/Pages/Components to Implement
- `app/(auth)/sign-in/page.tsx` — Email+password sign-in form
- `app/(auth)/mfa-setup/page.tsx` — TOTP QR setup + verification
- `app/(platform)/layout.tsx` — Authenticated shell with role-based nav
- `app/(platform)/dashboard/page.tsx` — Simple dashboard (tenant name, user role, quick stats placeholders)
- `app/(platform)/admin/users/page.tsx` — User list + invite form

### Edge Functions to Create
- `supabase/functions/enrich-jwt/index.ts` — Auth hook: reads user_roles + users, adds tenant_id/role/mfa_verified claims to JWT

### Tests to Add
```
tests/db/rls_tenants.sql         ← pgTAP: tenant isolation
tests/db/rls_users.sql           ← pgTAP: user cross-tenant isolation
tests/db/audit_immutability.sql  ← pgTAP: UPDATE/DELETE blocked
tests/unit/rbac.test.ts          ← hasPermission() for all role/action combinations
tests/integration/auth.test.ts   ← sign-in, JWT claims, middleware redirects
```

### Acceptance Criteria
1. Sign in as Tenant Admin → see dashboard, NOT another tenant's data
2. Sign in as Analyst → middleware blocks access to `/admin/config`
3. Write a test audit event → UPDATE and DELETE both raise Postgres exception
4. Invite a new user → email received → account activated → login with correct role
5. Tenant Admin without MFA → redirected to `/mfa-setup` on second login
6. All RLS policies: at least one pgTAP test per policy (correct + wrong tenant)
7. JWT decoded after sign-in contains `tenant_id`, `role`, `mfa_verified`

### Important Compliance Rules for This Pack
- `admin.ts` (service role client) MUST NEVER be imported in any file under `app/`
- No console.log or log statement may contain PII (names, emails, IDs)
- Audit log trigger must fire BEFORE any SELECT/INSERT on audit tables is attempted
- RLS must be enabled on EVERY new table — no exceptions

---

## TASK PACK 2 — Milestone 2: Consent, Onboarding Session, KYC Form

### Exact Scope
Customer-facing onboarding for individual customers: consent → personal data → document upload. Session must be resumable.

### Non-Goals
- IDV verification (Sumsub integration) — Milestone 3
- Screening — Milestone 3
- Risk scoring — Milestone 3
- Case management — Milestone 3
- Any corporate/KYB flow — Phase 2

### Prerequisites (Milestone 1 must be complete)
- Auth, RBAC, RLS, audit_log all working and tested
- JWT enrichment hook working (tenant_id in JWT)
- User invitation and role assignment working

### File Targets

**New files to create:**
```
supabase/migrations/0005_create_customers.sql
supabase/migrations/0006_create_documents.sql
supabase/migrations/0011_create_consent.sql
supabase/migrations/0012_create_sessions.sql
supabase/migrations/0013_create_workflows.sql
supabase/migrations/0014_rls_policies.sql  ← add policies for new tables
supabase/functions/compute-document-hash/index.ts
supabase/seed/default-workflow.sql  ← default individual KYC workflow JSON
app/(onboarding)/[tenantSlug]/onboard/page.tsx
app/(onboarding)/[tenantSlug]/onboard/[sessionId]/consent/page.tsx
app/(onboarding)/[tenantSlug]/onboard/[sessionId]/identity/page.tsx
app/(onboarding)/[tenantSlug]/onboard/[sessionId]/documents/page.tsx
app/(onboarding)/[tenantSlug]/onboard/[sessionId]/complete/page.tsx
app/api/sessions/route.ts
app/api/sessions/[id]/route.ts
app/api/sessions/[id]/steps/[stepId]/route.ts
app/api/customers/[id]/data/route.ts
app/api/documents/upload-url/route.ts
app/api/documents/[id]/route.ts
app/api/consent/route.ts
app/api/consent/[customerId]/route.ts
modules/onboarding/engine.ts
modules/onboarding/onboarding.service.ts
modules/onboarding/session.repository.ts
modules/onboarding/onboarding.types.ts
modules/kyc-individual/kyc.service.ts
modules/kyc-individual/kyc.repository.ts
modules/kyc-individual/kyc.types.ts
modules/documents/documents.service.ts
modules/documents/documents.repository.ts
modules/documents/documents.types.ts
modules/consent/consent.service.ts
modules/consent/consent.repository.ts
modules/consent/consent.types.ts
lib/validations/kyc.ts      ← Zod schemas for all M-02 fields
lib/validations/consent.ts
lib/validations/documents.ts
components/onboarding/consent-form.tsx
components/onboarding/identity-form.tsx
components/onboarding/document-upload.tsx
components/onboarding/progress-indicator.tsx
```

### Migrations to Create
- `0005_create_customers.sql` — customers, customer_data_versions (append-only)
- `0006_create_documents.sql` — documents, document_events (append-only)
- `0011_create_consent.sql` — consent_records (append-only)
- `0012_create_sessions.sql` — onboarding_sessions
- `0013_create_workflows.sql` — workflow_definitions (versioned)

### APIs to Implement
- `POST /api/sessions` — Initiate session; returns session_id + first step
- `GET /api/sessions/[id]` — Get session state + current step definition
- `POST /api/sessions/[id]/steps/[stepId]` — Submit step; advance workflow; return next step
- `PATCH /api/customers/[id]/data` — Update customer fields; creates customer_data_versions row
- `POST /api/documents/upload-url` — Generate signed upload URL + create documents row
- `GET /api/documents/[id]` — Get document metadata + generate signed download URL (15-min TTL)
- `POST /api/consent` — Capture consent record
- `GET /api/consent/[customerId]` — Get consent status

### WorkflowEngine Key Methods
```typescript
WorkflowEngine.loadDefinition(tenant_id: string, customer_type: string): Promise<WorkflowDefinition>
WorkflowEngine.getCurrentStep(session_id: string): Promise<WorkflowStep>
WorkflowEngine.advance(session_id: string, step_result: StepResult): Promise<WorkflowStep | null>
WorkflowEngine.evaluateBranch(conditions: BranchCondition[], session_data: SessionData): string
WorkflowEngine.getCompletionStatus(session_id: string): Promise<CompletionStatus>
```

### Default Workflow Seed (individual-kyc-standard-v1)
Load the JSON from DevPlan Section 5.1.1 as the default workflow for all tenants.

### UI Routes/Pages/Components
- Session initiation page: `[tenantSlug]/onboard/page.tsx`
- Consent step: multi-purpose consent form with purpose checkboxes
- Identity step: all PRD Section 4.1.1 Required fields with Zod validation
- Documents step: upload Passport + optional Proof of Address; drag-and-drop; type selection
- Complete step: summary + next steps message

### Edge Functions
- `compute-document-hash/index.ts` — Triggered by Supabase Storage insert; computes SHA-256; updates documents.file_hash

### Tests to Add
```
tests/unit/workflow-engine.test.ts    ← advance(), evaluateBranch(), all branch conditions
tests/unit/kyc-validation.test.ts     ← Zod schema validation for all required fields
tests/integration/consent.test.ts     ← consent API + DB immutability
tests/integration/documents.test.ts  ← upload flow, hash computation, signed URL
tests/db/rls_consent.sql             ← pgTAP consent_records append-only
tests/db/rls_documents.sql           ← pgTAP document_events append-only
```

### Acceptance Criteria
1. Consent form submitted → `consent_records` row created, immutable (UPDATE blocked)
2. Personal data form submitted → `customer_data_versions` row with all required fields
3. Passport uploaded → file in Storage, `documents` row created, `file_hash` populated
4. Interrupt session mid-flow → return → resumes at correct step
5. Attempt DELETE on `consent_record` → Postgres permission denied
6. All `audit_log` events present for consent, field updates, and document upload

### Important Compliance Rules for This Pack
- Consent must be first step — no personal data collected before consent is captured
- All field changes go to `customer_data_versions` — never a bare UPDATE on customers
- `document_events` must be append-only
- Document access ALWAYS via signed URL — never direct Storage URL
- Signed URL TTL: 15 minutes maximum
- `compute-document-hash` must use server-side SHA-256 (not client-side)

---

## TASK PACK 3 — Milestone 3: IDV, Screening, Risk Scoring, Case Management

### Exact Scope
Automated compliance checks + human review queue. End of this pack: complete end-to-end flow from consent to analyst decision.

### Non-Goals
- EDD full form content (M-06) — defer to Phase 2
- Multi-stage parallel approval — Phase 2
- Corporate KYB — Phase 2
- Adverse media screening — Phase 2
- Custom watchlists — Phase 2

### Prerequisites
- Milestones 1 + 2 complete
- Sumsub account + API credentials (C-03)
- ComplyAdvantage account + API credentials (C-04)
- Resend account + domain DNS configured (C-05)
- UAE Executive Office list confirmed in ComplyAdvantage (C-06)
- Sumsub UAE PDPL legal confirmation (C-07)

### File Targets (New)
```
supabase/migrations/0007_create_screening.sql
supabase/migrations/0008_create_risk.sql
supabase/migrations/0009_create_cases.sql
supabase/migrations/0010_create_approvals.sql
supabase/functions/process-idv-webhook/index.ts
supabase/functions/process-screening-webhook/index.ts
supabase/functions/retry-failed-webhooks/index.ts
app/api/webhooks/idv/route.ts
app/api/webhooks/screening/route.ts
app/api/screening/[customerId]/route.ts
app/api/screening/jobs/[jobId]/route.ts
app/api/screening/hits/[hitId]/resolve/route.ts
app/api/risk/[customerId]/route.ts
app/api/risk/[customerId]/latest/route.ts
app/api/cases/route.ts
app/api/cases/[id]/route.ts
app/api/cases/[id]/events/route.ts
app/api/approvals/[caseId]/route.ts
modules/screening/screening.service.ts
modules/screening/screening.repository.ts
modules/screening/adapters/ScreeningAdapter.ts
modules/screening/adapters/ComplyAdvantageAdapter.ts
modules/screening/adapters/MockScreeningAdapter.ts
modules/screening/screening.types.ts
modules/risk/risk.service.ts
modules/risk/risk.repository.ts
modules/risk/dimensions/customer.dimension.ts
modules/risk/dimensions/geographic.dimension.ts
modules/risk/dimensions/product.dimension.ts
modules/risk/risk.types.ts
modules/cases/cases.service.ts
modules/cases/cases.repository.ts
modules/cases/cases.types.ts
modules/approvals/approvals.service.ts
modules/approvals/approvals.repository.ts
modules/approvals/approvals.types.ts
modules/notifications/notifications.service.ts
modules/notifications/adapters/NotificationAdapter.ts
modules/notifications/adapters/ResendAdapter.ts
modules/notifications/adapters/MockNotificationAdapter.ts
app/(platform)/cases/page.tsx
app/(platform)/cases/[caseId]/page.tsx
components/cases/case-queue.tsx
components/cases/case-filters.tsx
components/cases/case-detail.tsx
components/cases/analyst-actions.tsx
components/cases/screening-hits.tsx
components/cases/risk-score-display.tsx
```

### Migrations
- `0007_create_screening.sql` — screening_jobs, screening_hits, screening_hit_resolutions + webhook_events queue table
- `0008_create_risk.sql` — risk_assessments (immutable)
- `0009_create_cases.sql` — cases, case_events (append-only)
- `0010_create_approvals.sql` — approvals (append-only, immutable after decision)

### APIs
- `POST /api/webhooks/idv` — Inbound IDV webhook (validate signature → queue → Edge Function)
- `POST /api/webhooks/screening` — Inbound screening webhook (validate signature → queue → Edge Function)
- `POST /api/screening/[customerId]` — Initiate screening job (async, returns job_id)
- `GET /api/screening/jobs/[jobId]` — Poll job status + results
- `POST /api/screening/hits/[hitId]/resolve` — Record analyst resolution
- `POST /api/risk/[customerId]` — Trigger risk score computation (returns assessment_id)
- `GET /api/risk/[customerId]/latest` — Get latest risk assessment with factor breakdown
- `GET /api/cases` — List cases (role-filtered: analyst=assigned only, MLRO=all high-risk)
- `GET /api/cases/[id]` — Case detail (customer, documents, screening, risk, timeline)
- `POST /api/cases/[id]/events` — Add case event (note, RAI, escalation) — append-only
- `POST /api/approvals/[caseId]` — Record approval decision

### Screening Adapter Interface
```typescript
interface ScreeningAdapter {
  submitScreening(params: ScreeningParams): Promise<{ job_id: string }>;
  getResults(job_id: string): Promise<ScreeningResult>;
  parseWebhook(body: unknown, signature: string): Promise<ScreeningResult>;
}
```
MockScreeningAdapter must be the default in `test` and `development` NODE_ENV.

### Risk Scoring (3 Dimensions)
- **Customer dimension (30%):** entity_type, nationality, PEP status, occupation, dual_nationality
- **Geographic dimension (25%):** country_of_residence, country_of_nationality, FATF list status
- **Product dimension (20%):** product_type, expected_transaction_volume, currency
- Score 0–100; bands: LOW (0–30), MEDIUM (31–60), HIGH (61–80), UNACCEPTABLE (81–100)
- `factor_breakdown` JSONB stored in risk_assessments for explainability

### Case Routing Logic (in WorkflowEngine)
- risk_band = LOW → auto-approve (no case created); onboarding_session status = approved
- risk_band = MEDIUM → case created, assigned to standard review queue
- risk_band = HIGH → case created, assigned to EDD review queue (MLRO visibility)
- risk_band = UNACCEPTABLE → case created, assigned to senior escalation queue

### Case Detail Security Rules
- Document access: ALWAYS via signed URL (15-min TTL), generated per request
- SAR field: returned from DB but MASKED in API response for non-MLRO roles
- Analyst note: immutable once submitted (append-only via case_events)

### Notification Pattern (RAI)
Use `MockNotificationAdapter` in dev/test, `ResendAdapter` in staging/prod. Factory pattern based on `NODE_ENV` or tenant config.

### Tests to Add
```
tests/unit/risk-scoring.test.ts          ← all dimension + composite score scenarios
tests/unit/screening-adapter.test.ts     ← MockAdapter behavior
tests/unit/workflow-routing.test.ts      ← risk band → case routing
tests/integration/idv-webhook.test.ts    ← webhook → kyc_results
tests/integration/screening.test.ts      ← job → hits → resolution
tests/integration/cases.test.ts          ← case creation, events, approval
tests/db/rls_cases.sql                   ← pgTAP analyst sees only assigned cases
tests/db/rls_approvals.sql               ← pgTAP approvals immutable
```

### Acceptance Criteria
1. Submit test onboarding → IDV webhook → `kyc_results` row created (immutable)
2. Screening → hits created → analyst resolves → `screening_hit_resolutions` immutable
3. Risk score computed → correct band → case created for non-auto-approve
4. Analyst approves → `approvals` row written, immutable
5. MLRO logs in → sees only high-risk cases
6. Failed webhook (simulated) → retried by pg_cron
7. All approvals in audit_log with actor_id, role, timestamp

---

## TASK PACK 4 — Milestone 4: Admin Config UI

### Exact Scope
Tenant Admin configuration interface. Workflow management. Audit log viewer.

### Non-Goals
- Full drag-and-drop workflow builder (Phase 3)
- Risk weight editing (Phase 2)
- Notification channel management beyond basic template copy editing

### Prerequisites
- Milestones 1–3 complete
- At least one end-to-end onboarding completed (to prove configs being managed work)

### File Targets (New)
```
supabase/migrations/  (add tenant_config table if not already done)
app/(platform)/admin/config/page.tsx
app/(platform)/admin/workflows/page.tsx
app/(platform)/audit/page.tsx
app/api/admin/config/route.ts
app/api/admin/workflows/route.ts
app/api/audit/route.ts
modules/admin-config/config.service.ts
modules/admin-config/workflow.service.ts
modules/admin-config/config.types.ts
components/admin/config-form.tsx
components/admin/workflow-manager.tsx
components/admin/branding-settings.tsx
components/audit/audit-log-table.tsx
components/audit/audit-filters.tsx
```

### Key Implementation Rules
- `tenant_config` changes MUST create a new version row — never overwrite
- Workflow activation requires `acknowledged_by` (MLRO user_id) in the request — validate server-side
- Audit log query MUST always include `tenant_id` filter — never global query
- Only `tenant_admin` role can write to `tenant_config` and `workflow_definitions`

### Acceptance Criteria
1. Tenant Admin changes document requirements → new workflow_definitions version; old preserved
2. Workflow activation without MLRO acknowledgement → server returns 403
3. MLRO acknowledges → activation proceeds → audit event written
4. Audit log viewer: query customer events → complete chronological history
5. Branding logo change → customer-facing onboarding UI shows new logo

---

## TASK PACK 5 — Milestone 5: Hardening

### Exact Scope
Production hardening: PII audit, RLS test suite, error handling, load test, MLRO walkthrough.

### Non-Goals
- New features
- Phase 2 modules

### Prerequisites
- Milestones 1–4 complete

### Key Deliverables
1. `sanitise()` utility in `lib/errors/` — strips PII from error objects before logging
2. Complete pgTAP test suite in `tests/db/` for ALL tables and ALL RLS policies
3. Automated PII scan in CI pipeline (grep-based scan for common PII patterns in log strings)
4. Error boundary components for all critical UI paths
5. Graceful degradation: IDV unavailable → manual review flag; screening unavailable → hold queue
6. Retry logic: exponential backoff for all external API calls
7. 10 scripted onboarding scenarios in `tests/e2e/`
8. Load test: 50 concurrent sessions using k6 or similar

### Acceptance Criteria
1. All 10 scenarios pass end-to-end with zero errors
2. Automated PII scan passes (zero PII found in log output)
3. All RLS policies pass pgTAP (correct + wrong tenant + service role)
4. MLRO walkthrough completed and sign-off documented
5. Audit log export: valid, structured, compliant output for a test customer

---

## TASK PACK 6 — Milestone 6: Production Deployment

### Exact Scope
Deploy to production. Activate monitoring. First real customer onboarded.

### Non-Goals
- Phase 2 feature development
- New schema migrations (all migrations were applied in M1–M4)

### Prerequisites
- Milestone 5 complete with MLRO sign-off
- Production Supabase project (paid plan) created
- Production domain DNS configured
- Production env vars prepared

### Key Tasks
1. Apply all migrations to production Supabase instance
2. Configure production Vercel project (env vars, domain, SSL)
3. Set up Sentry (error tracking) + Vercel log drain
4. Activate pg_cron jobs (document_expiry_check, retry_failed_webhooks)
5. Run backup + restoration test on production
6. Write operational runbook (3 scenarios minimum)
7. Onboard first real customer end-to-end
8. Document incident response contacts

### Acceptance Criteria
1. Production smoke test: full onboarding on production — works end-to-end
2. Sentry test error received and alert fired
3. pg_cron jobs confirmed running from Supabase logs
4. Backup restoration test: data restored correctly
5. Monitoring dashboard: active sessions, case queue, webhook success rate visible

---

*Claude Code Task Packs v1.0 · Generated from PRD v1.0 + DevPlan v1.0 · TruVis International Services · 2026*
