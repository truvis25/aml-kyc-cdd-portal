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

## External spec sources

Docs-Sync reads these after each module ships to identify features to update
and to post a shipping note to the Notion dashboard.

```yaml
externalSpecSources:
  - type: google-sheets
    name: "TruVis AML/KYC/CDD Full SaaS Command Center"
    fileId: "1Xbi2tkMjwa6qrbxXRQTvvuOIegje0j1M"
    featureSheet: "Feature Registry"
    # MCP tool: mcp__7747192d-eb57-4307-b135-d75414e1e6dd__read_file_content
    # Read-only: manual update required after Docs-Sync identifies changed rows.
    # Column layout: A=Module  B=Feature  C=Status  D=Full SaaS Req  G=Phase
    #                H=Priority  I=MVP Req.  J=Next Sprint
    slugToModuleName:
      auth: "Platform Core"
      onboarding: "Customer Onboarding"
      kyc-individual: "Identity Verification"
      kyb: "Corporate KYB / UBO"
      documents: "Document Management"
      screening: "Screening & Monitoring"
      risk: "Risk / CDD / EDD"
      cases: "Case Management"
      approvals: "Case Management"
      sar: "SAR / MLRO Workbench"
      audit: "Reporting & Audit"
      reporting: "Reporting & Audit"
      notifications: "Notifications"
      admin-config: "Tenant Admin / Workflow Config"
      dashboards: "Dashboards"
      billing: "Billing / Commercial"
      uae: "UAE Market Features"
      consent: "Customer Onboarding"

  - type: notion
    name: "TruVis AML/KYC/CDD Portal — Executive Launch Dashboard"
    # MCP tools: mcp__e3f9c412-8add-43e2-b9e5-0c259dec370c__notion-*
    dashboardPageId: "354bc997-4963-811c-bdcc-c441ca591572"
    dashboardPageUrl: "https://www.notion.so/354bc9974963811cbdccc441ca591572"
    moduleSubpages:
      auth:         "https://www.notion.so/354bc9974963817eabe3fd391842d7a7"
      onboarding:   "https://www.notion.so/354bc997496381fa86e4d030bf4d94c4"
      kyc-individual: "https://www.notion.so/354bc9974963816eb5b5e30bf864a855"
      kyb:          "https://www.notion.so/354bc997496381339200c7223d6fe9ce"
      documents:    "https://www.notion.so/354bc99749638151a3d7e13661cd5651"
      screening:    "https://www.notion.so/354bc997496381d88037d1939bc39318"
      risk:         "https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec"
      cases:        "https://www.notion.so/354bc997496381ed97a8d2296ec74f58"
      approvals:    "https://www.notion.so/354bc997496381ed97a8d2296ec74f58"
      sar:          "https://www.notion.so/354bc99749638114adbcc56b111c6243"
      audit:        "https://www.notion.so/354bc997496381859409e18351e70c9d"
      reporting:    "https://www.notion.so/354bc997496381859409e18351e70c9d"
      notifications: "https://www.notion.so/354bc9974963816693ebc0477a448299"
      admin-config: "https://www.notion.so/354bc997496381748cfacd9359a1d48a"
      dashboards:   "https://www.notion.so/354bc99749638108bb39f1f93e024b81"
      billing:      "https://www.notion.so/354bc997496381c9a138d40cad7178be"
      uae:          "https://www.notion.so/354bc997496381669adcc34e4adc7cdf"
      consent:      "https://www.notion.so/354bc997496381fa86e4d030bf4d94c4"
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
