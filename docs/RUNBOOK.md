# Operational Runbook — AML/KYC/CDD Portal

> Source of truth for on-call response. Pair with `docs/DEPLOYMENT.md` for
> deploy steps and `docs/MILESTONE_CHECKLISTS.md` for milestone acceptance.

This runbook covers **production incident response** plus the **routine
operational tasks** that aren't part of normal app usage.

---

## 1. Architecture refresh (one-page)

```
   Customer ─────▶ Vercel (Next.js, region me1)
                        │
                        ├─▶ Supabase Postgres (RLS-scoped reads/writes)
                        │     └─ pg_cron jobs:
                        │         · retry-failed-webhooks (hourly)
                        │         · document_expiry_check (daily, future)
                        ├─▶ Supabase Storage
                        │     · kyc-documents (private)
                        │     · tenant-branding (public)
                        ├─▶ Supabase Edge Functions (Deno):
                        │     · process-screening-webhook
                        │     · process-idv-webhook (stub until Sumsub creds land)
                        │     · retry-failed-webhooks
                        │     · compute-document-hash
                        └─▶ Resend (transactional email — RAI / approval / rejection)
```

All inbound provider webhooks → `webhook_events` queue (atomic claim + retry).
All outbound mutations → `audit_log` (append-only, hash-chained, never updated).

---

## 2. Health probes

Run these any time a customer reports something off.

### 2.1 Is the app serving?

```bash
curl -fsS https://<prod-host>/api/health || echo DOWN
```

If down: check Vercel → Production → Deployments. If a recent deploy is
broken, **roll back via the Vercel dashboard's "Promote to Production" on
the previous green deployment** before debugging — protect customer flow first.

### 2.2 Is Supabase healthy?

Supabase Dashboard → Settings → Status. If degraded: pause webhook ingest
(see §6.2) so the queue doesn't grow unbounded; resume once green.

### 2.3 Is the webhook queue draining?

```sql
-- Run as service-role in the SQL Editor.
SELECT status, count(*)
  FROM webhook_events
 WHERE received_at > now() - interval '24 hours'
 GROUP BY status;
```

Expected steady-state distribution after first hour: **mostly `processed`**,
with a small trailing edge of `pending`. **Alarm thresholds:**
- `pending` count rising over consecutive hours → retry job not firing
  (see §6.1).
- `failed` > 0 → check `last_error`; if same error across multiple events,
  escalate.
- `dead_letter` > 0 → manual triage required (see §6.3).

### 2.4 Is the audit chain intact?

Quick "every row has a hash" check:

```sql
SELECT count(*)
  FROM audit_log
 WHERE row_hash IS NULL OR length(row_hash) != 64;
```
Must always return `0`. If non-zero, escalate immediately — the
hash-chain trigger is failing or has been bypassed.

**Full chain verification (forensic):** runs every audit row through
`verify_audit_chain()` and reports `OK` / `BROKEN_CHAIN` / `TAMPERED_HASH`.
Run after any incident touching the database, and on a routine cadence
(at minimum monthly):

```bash
npm run verify:audit-chain                 # all tenants, human output
npm run verify:audit-chain -- --json       # machine-readable summary
npm run verify:audit-chain -- <tenant_id>  # single tenant
```

Exit code `0` = every chain OK. Exit code `1` = at least one tenant has
broken or tampered rows — **P1 incident, page MLRO and engineering on-call
immediately**. The migration history (0037) and pgTAP test
(`tests/db/019_audit_hash_chain.sql`) document the expected behaviour.

If you need to verify ad-hoc from `psql`:

```sql
SELECT row_id, event_time, status
  FROM verify_audit_chain('<tenant_id>'::UUID)
 WHERE status != 'OK';
```

---

## 3. Incident response — P1 / P2 / P3

| Severity | Definition | Response | Notify |
|---|---|---|---|
| **P1** | Customer onboarding blocked OR audit_log writes failing OR cross-tenant data leak suspected | Page on-call within 15 min; mitigate before debug | MLRO + Tenant Admin + Engineering |
| **P2** | Reviewer queue not loading OR webhook backlog growing OR email delivery failing | Acknowledge within 1 hour; mitigate within 4 hours | Engineering + Tenant Admin |
| **P3** | Slow queries, cosmetic UI issue, single-user issue | Triage next business day | Engineering |

When mitigating, **always log the action in `audit_log`** if the action is
data-mutating. Use the `system` actor_role per the pattern in
`modules/cases/cases.service.ts`.

---

## 4. Common incidents

### 4.1 Customer can't open onboarding link → 404

Causes:
1. Tenant slug typo in shared link.
2. Session expired (`onboarding_sessions.expires_at` in past).
3. Workflow deactivated (`workflow_definitions.is_active = false`).

Resolution:
1. In `/admin/users` confirm tenant slug.
2. Status portal at `/{slug}/status/<session_id>` will redirect to a fresh
   session if the original expired.
3. If workflow disabled: re-activate (requires MLRO ack — see §5.1).

### 4.2 RAI / approval / rejection email never arrives

1. Check `notification_events` for the case:
   ```sql
   SELECT created_at, template, status, error
     FROM notification_events
    WHERE case_id = '<case_id>'
    ORDER BY created_at DESC
    LIMIT 5;
   ```
2. `status = 'failed'` with `error = 'not_configured'` → Resend env vars
   missing on Vercel project. Fix and redeploy.
3. `status = 'failed'` with `error = 'rate_limit_exceeded'` → wait, then
   re-trigger via the case action UI.
4. `status = 'sent'` but customer says no email → check Resend dashboard
   for bounce / delivery telemetry; the customer's email address may be
   undeliverable.

The case event itself is durably recorded regardless of email status —
analysts can re-issue an RAI if needed; idempotency keys prevent
double-sends within the same day.

### 4.3 Document upload stuck at "pending"

`documents.file_hash` is populated by the `compute-document-hash` Edge
Function fired from `confirmUpload`. If it's blank after 30 seconds:
1. Check Supabase → Edge Functions → Logs for the function.
2. Re-fire by hand:
   ```bash
   curl -fsSL "https://<project-ref>.supabase.co/functions/v1/compute-document-hash" \
     -X POST -H "Authorization: Bearer <SERVICE_ROLE_JWT>" \
     -H "Content-Type: application/json" \
     -d '{"document_id":"<uuid>","tenant_id":"<uuid>"}'
   ```
   Function is idempotent on already-hashed rows (returns `cached: true`).

### 4.4 Cross-tenant data appears in a list

**P1.** Likely RLS policy regression. Immediate steps:
1. Capture the row IDs and the user's `tenant_id` for forensics.
2. Disable the affected route (Vercel: take the deployment offline) to
   contain the leak.
3. Investigate — `pg_policies` for the affected table; compare against
   what's in `supabase/migrations/`.
4. Don't ship a fix until pgTAP coverage proves the policy now holds.

The pgTAP suite under `tests/db/` is your test harness: every
tenant-scoped table has a positive + negative case.

### 4.5 SAR-flagged case visible to non-MLRO

**P1.** SAR field redaction is currently UI-gated only; this counts as a
tipping-off risk. Steps:
1. Identify the user account that saw the leak; capture their session.
2. If they actioned the case after seeing SAR status, escalate to MLRO
   for tipping-off assessment.
3. Patch — typically a missed permission check on the page or component.

---

## 5. Routine operations

### 5.1 Activating a new workflow version

1. Tenant Admin → `/admin/workflows` → click "Activate" on the new version.
2. **Server returns 409** if no MLRO ack exists for that version.
3. MLRO signs in → `/admin/workflows` → "Acknowledge as MLRO" on the row,
   adding a note for the audit trail.
4. Tenant Admin re-clicks Activate → succeeds; row in
   `workflow_activation_acks` proves due process; audit_log captures both
   the ack and the activation.

### 5.2 Updating tenant configuration

1. Tenant Admin → `/admin/config` → adjust toggles / required documents /
   branding / display name → click "Save new version".
2. A new `tenant_config` row is appended; the previous version is
   preserved. Inspect history at the bottom of the same page.
3. Logo uploads go via the dedicated uploader; replacing a logo writes a
   new tenant_config version automatically.

### 5.3 Rotating Supabase service-role key

1. Generate a new key in Supabase Dashboard → Project Settings → API.
2. Update Vercel project env var `SUPABASE_SERVICE_ROLE_KEY` (Production +
   Preview).
3. Redeploy — new functions and API routes pick up the new key.
4. Revoke the old key in the dashboard.
5. Verify the hourly `retry-failed-webhooks` job picks up after rotation
   (the pg_cron schedule includes the bearer token; if it was set with the
   old key, re-run the `cron.schedule` block from `CLAUDE.md` to re-arm).

### 5.4 Audit log export for a customer

Used for regulator / DSAR responses.

```bash
# Authenticated as MLRO or Tenant Admin
curl -fsSL "https://<prod-host>/api/audit/export?customer_id=<uuid>" \
  -H "Cookie: <auth-cookie>" \
  > audit-customer-<uuid>.jsonl
```

The export is JSON-Lines (one event per line). Field shape is documented
in `modules/audit/audit.types.ts`. Hand to MLRO for review before sharing
externally.

---

## 6. Webhook & queue operations

### 6.1 Retry job not firing

Symptom: `webhook_events.status = 'pending'` count climbs hourly without
draining.

1. Verify the cron schedule:
   ```sql
   SELECT jobid, schedule, command, active
     FROM cron.job
    WHERE jobname LIKE 'retry-failed-webhooks%';
   ```
2. If absent, re-run the schedule block from `CLAUDE.md` § "Post-Deploy".
3. If present but `active = false`, re-enable:
   ```sql
   SELECT cron.alter_job(jobid := <id>, active := true)
     FROM cron.job WHERE jobname = 'retry-failed-webhooks-hourly';
   ```
4. Manually drain once to clear backlog:
   ```bash
   curl -fsSL "https://<project-ref>.supabase.co/functions/v1/retry-failed-webhooks" \
     -X POST -H "Authorization: Bearer <SERVICE_ROLE_JWT>"
   ```

### 6.2 Pause webhook ingest (provider outage / our outage)

There is no dedicated kill-switch. To pause processing without dropping
events:

```sql
-- Mark all newly-arriving webhooks as requiring manual replay.
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;
UPDATE webhook_events SET paused = true WHERE status = 'pending';
```

Resume by clearing the column and re-arming retry. Any future formalisation
of this should land in a dedicated migration.

### 6.3 Dead-letter triage

`webhook_events.status = 'dead_letter'` means the queue has given up on
retrying. Inspect:

```sql
SELECT id, provider, event_type, attempts, last_error, payload
  FROM webhook_events
 WHERE status = 'dead_letter'
 ORDER BY received_at DESC;
```

For each: decide whether the event is replayable (provider issue, transient
DB issue) or genuinely undeliverable (malformed payload). Replay:

```sql
UPDATE webhook_events
   SET status = 'pending', attempts = 0, next_retry_at = now(), last_error = NULL
 WHERE id = '<event_id>';
```

The next retry tick will pick it up.

---

## 7. Backups & disaster recovery

| Item | Cadence | Owner |
|---|---|---|
| Postgres PITR (Supabase Pro) | Continuous, 7-day retention | Supabase |
| Daily snapshot | Daily 02:00 UTC | Supabase |
| Storage bucket replication | Per Supabase plan | Supabase |
| Quarterly restore drill | Q1 / Q3 | Engineering on-call |

**Restore drill protocol:**
1. Pick a non-production environment (staging branch DB).
2. Restore the latest daily snapshot via the Supabase Dashboard → Database
   → Backups.
3. Hit `/api/audit/export?customer_id=<known-test>` and confirm rows
   match the snapshot's expected count.
4. Document the wall-clock time end-to-end and any deviations from this
   runbook.

---

## 8. On-call escalation

| Issue type | First responder | Escalation |
|---|---|---|
| App down / customer flow broken | Engineering on-call | CTO |
| Audit chain integrity | Engineering on-call | CTO + MLRO |
| Compliance decision affected | MLRO | Compliance Director |
| Cross-tenant leak | Engineering on-call + MLRO | CTO + DPO + regulator notice path |
| Provider outage (Sumsub / ComplyAdvantage / Resend) | Engineering on-call | Vendor support + status page |

Contact details live in the engineering team's password manager; this
runbook intentionally doesn't carry phone numbers.

---

## 9. Change-management checklist

Use before any production change that mutates data or configuration:

- [ ] Migration applied locally + on staging Supabase Preview branch
- [ ] `npm run check` is green (typecheck + lint + tests + PII scan)
- [ ] `supabase test db` passes against the preview branch DB
- [ ] Audit-log writes verified (hash chain still intact)
- [ ] If RLS-touching: pgTAP test added under `tests/db/` covering the
      change
- [ ] Notify MLRO if the change affects case routing or approval logic
- [ ] Roll-back plan documented in the PR description

---

---

## 10. Pre-Launch Checklist

See `docs/RELEASE_CHECKLIST.md` for the full pre-deploy gate (typecheck, lint, tests, DB migration dry-run, smoke test, post-deploy verification).

For product, compliance, security, and commercial readiness gates before the first paying tenant, see `docs/FINAL_LAUNCH_PLAN.md` §10.

---

## 11. Incident Response (stub — expand before first tenant onboards)

### Severity classification

| Severity | Definition | Target response |
|---|---|---|
| P1 | Customer flow blocked, cross-tenant leak, audit_log writes failing | Page on-call within 15 min; mitigate before debug |
| P2 | Reviewer queue not loading, webhook backlog growing, email failing | Acknowledge within 1 hour; resolve within 4 hours |
| P3 | Slow queries, cosmetic issue, single-user problem | Triage next business day |

### Response steps

1. **Identify** — determine scope from Sentry, Vercel logs, Supabase logs, and `webhook_events` queue.
2. **Contain** — if cross-tenant leak or audit corruption suspected, take affected route(s) offline immediately (Vercel rollback — §12).
3. **Communicate** — notify affected tenant admins and MLRO within 30 minutes for P1. Log the incident in `audit_log` using the `system` actor pattern.
4. **Resolve** — apply fix via PR (no hotfixes directly to production).
5. **Review** — post-incident review within 48 hours for P1; document findings and preventive action.

> Full incident-response playbooks (runbook for each scenario type) to be written during Sprint 3 operational hardening (S3-16).

---

## 12. On-Call Rotation (stub — define before Sprint 3 ship gate)

| Week | Primary on-call | Secondary on-call |
|---|---|---|
| TBD | TBD | TBD |

- PagerDuty (or equivalent) integration: to be wired in Sprint 3 (S3-11).
- Escalation path for P1: Primary on-call → CTO → DPO (if data involved) → regulator notice path (if required under UAE PDPL / ADGM DPR).
- Contact details stored in the engineering team's shared password manager (not in this runbook).

---

*Runbook v1.1 — updated 2026-05-07 (Sprint 1 S1-07). Update with every
new operational scenario discovered during the first production cohort.*
