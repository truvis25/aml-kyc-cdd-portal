# PROJECT.md — AML/KYC/CDD Portal

## Identity

- **Project name:** `aml-kyc-cdd-portal`
- **Domain:** Compliance portal for Anti-Money Laundering (AML), Know Your Customer (KYC), and Customer Due Diligence (CDD) workflows
- **Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Supabase Postgres + Auth + Storage · Tailwind CSS v4 · Vercel (region: me1 Bahrain)

---

## Launch checklist

```
launchChecklistPath: docs/FINAL_LAUNCH_PLAN.md
launchChecklistOffsets:
  start: 1
```

The file at `docs/FINAL_LAUNCH_PLAN.md` contains markdown checkboxes (`- [ ] ...`).
Tech Lead reads the first unchecked items and asks you to confirm the next module.

---

## Branch convention

```
branchConvention: feat/<slug> | fix/<slug> | refactor/<slug> | chore/<slug>
anchorToken: <!-- PROJECT:<slug> -->
```

---

## Module taxonomy

```
moduleTaxonomy: |
  auth | onboarding | kyc-individual | kyb | documents | screening | risk |
  cases | approvals | sar | audit | notifications | admin-config | consent |
  dashboards | reporting
```

---

## Dispatch defaults

```
builderDefault: be-first
```

Backend Dev runs first (Supabase migrations + RLS + API routes), then Frontend Dev
consumes the typed API surface. This matches the portal's compliance-first posture
where every data surface is locked down before the UI is built.

---

## Payment pipeline scope

```
paymentScope: none
```

No payment processing — AML/KYC compliance portal only.

---

## Brand tokens

```
brandTokensPath: tailwind.config.ts
```

Frontend Dev reads this for correct colours, spacing, and typography.

---

## External spec sources (optional)

Notion pages or wiki URLs that Docs-Sync should reference in PR descriptions.

```yaml
externalSpecSources: []
```

---

## Additional foundations

Files beyond the baseline that `check-foundations.ts` should require:

```yaml
additionalFoundations:
  - docs/FINAL_LAUNCH_PLAN.md
  - docs/ROLES_DASHBOARDS_FLOWS.md
  - lib/constants/events.ts
  - lib/supabase/database.types.ts
  - middleware.ts
  - MANUAL_QA_BACKLOG.md
```

---

## Skip-set heuristics

```yaml
skipSetPaths:
  - app/(auth)/              # auth flow — FE-only unless auth logic changes
  - components/ui/           # Radix/shadcn primitives — FE-only
  - app/(marketing)/         # public marketing pages — FE-only
```

---

## Notes for agents

```
agentNotes: |
  - lib/supabase/admin.ts (service role) must NEVER be imported in app/ — modules only.
  - Every table must have RLS enabled. Multi-tenancy via tenant_id on all tenant-scoped tables.
  - audit_log and customer_data_versions are append-only — enforced by DB trigger.
  - JWT enrichment via custom_access_token_hook (migration 0005) — not an Edge Function.
  - Signed URLs max 15 minutes — never cache.
  - No PII in logs — use customer_id, session_id, case_id.
  - Webhook events queue before provider calls (webhook_events table).
  - Screening uses mock adapter locally; complyadvantage in production.
  - Resend email is a no-op when RESEND_API_KEY is unset — case actions still proceed.
  - Local test credentials: admin@truvis-test.local / AdminPass123! for admin role.
```
