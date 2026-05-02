---
name: cloud-agent-starter
description: Practical setup and testing workflow for Cloud agents working on the AML/KYC/CDD Portal.
metadata:
  priority: 5
  pathPatterns:
    - 'app/**'
    - 'components/**'
    - 'modules/**'
    - 'lib/**'
    - 'supabase/**'
    - 'tests/**'
    - 'playwright.config.ts'
    - 'package.json'
  promptSignals:
    phrases:
      - "run this codebase"
      - "test this codebase"
      - "Cloud agent setup"
      - "AML KYC CDD portal"
---

# Cloud Agent Starter: AML/KYC/CDD Portal

Use this skill first when you need to run, test, or debug this repo in Cursor Cloud. The active app is the root Next.js 16 + Supabase codepath; `backend/` and `frontend/` are legacy artifacts unless a task explicitly targets them.

## 1. Baseline setup

1. Install dependencies if needed:
   - `npm install`
2. Create local env:
   - `cp .env.example .env.local`
3. Fill or mock env values:
   - For real Supabase-backed work, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`.
   - For public marketing or pure unit-test work, placeholder Supabase values are usually enough if the touched code never calls Supabase.
   - Leave `RESEND_API_KEY` empty to mock email delivery; sends are recorded as `status='failed'` / `error='not_configured'` and case actions still proceed.
   - Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
4. Validate env:
   - `npm run validate:env`
5. Start local Supabase when authenticated app, API, RLS, storage, or DB work is in scope:
   - `supabase start`
   - `supabase db reset`
6. Start the app:
   - `npm run dev`
   - In Cloud, keep long-running commands in a named tmux session so later agents can inspect or reuse them.

Local seeded login:
- Admin: `admin@truvis-test.local` / `AdminPass123!`
- Non-MFA E2E users all use `TestPass123!`: `analyst@truvis-test.local`, `sr@truvis-test.local`, `agent@truvis-test.local`, `readonly@truvis-test.local`
- MFA-required roles are intentionally not covered by the current E2E seed.

JWT hook:
- Local Supabase config enables `public.custom_access_token_hook`.
- If JWT role claims are missing after `supabase db reset`, open Studio and confirm Authentication -> Hooks -> Custom Access Token Hook points to `public.custom_access_token_hook`.

## 2. Public marketing pages (`app/(marketing)`, `components/marketing`, `app/api/lead`)

Run when editing landing, pricing, legal, signup, lead capture, or public copy.

Workflow:
1. `npm run typecheck`
2. `npm run lint`
3. `npm run test -- tests/unit/marketing-lead.test.ts`
4. `npm run build`
5. `npm run test:e2e:marketing`

Notes:
- Marketing E2E needs no auth or DB.
- Use `E2E_BASE_URL=https://<preview-url> npm run test:e2e:marketing` to smoke-test a Vercel preview instead of local `npm run start`.

## 3. Authenticated platform UI (`app/(platform)`, `components/shared`, `components/cases`, `modules/dashboards`)

Run when editing dashboards, cases, customers, SAR, audit, reporting, admin pages, sidebar, or RBAC-visible UI.

Workflow:
1. `supabase start`
2. `supabase db reset`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run test:unit`
6. `npm run build`
7. `npm run test:e2e:app`

Manual smoke:
1. Start `npm run dev`.
2. Log in as the role that owns the changed surface.
3. Verify role routing and forbidden links with analyst, senior reviewer, onboarding agent, and read-only users as relevant.

Feature gates and auth gotchas:
- `npm run test:e2e:app` sets `E2E_RUN_APP=1`; without it the app project is skipped.
- Tenant admin and MLRO require TOTP MFA and are not seeded for E2E yet.
- RBAC is enforced in middleware/proxy and again inside API route handlers.

## 4. Customer onboarding (`app/(onboarding)`, `modules/onboarding`, `modules/kyc-individual`, `modules/documents`, `modules/consent`)

Run when editing onboarding sessions, consent, identity, business details, document upload/download, or status pages.

Workflow:
1. `supabase start`
2. `supabase db reset`
3. `npm run typecheck`
4. `npm run lint`
5. Run focused unit tests for touched modules, or `npm run test:unit` if coverage is unclear.
6. `npm run build`
7. Manually walk the seeded tenant onboarding URL if the change is UI-visible.

Storage/document notes:
- Supabase Storage is provided by the local Supabase stack.
- Signed URLs should be generated fresh; do not cache signed URL output.
- Document hash work is handled by `compute-document-hash`; when testing manually, inspect function logs if a document stays pending.

## 5. API routes and domain modules (`app/api`, `modules`, `lib`)

Run when editing server logic, route handlers, validation, RBAC, risk, screening, cases, approvals, SAR, or notifications.

Workflow:
1. `npm run typecheck`
2. `npm run lint`
3. Run the closest unit test file under `tests/unit/`.
4. If Supabase reads/writes are involved: `supabase start && supabase db reset`, then hit the route through the app or an authenticated E2E flow.
5. For broad changes: `npm run check`

Mocking/provider notes:
- Screening uses the mock adapter outside production; production uses `complyadvantage`.
- Resend is safe to leave unconfigured for local testing; notification events still record the no-op result.
- Do not log PII. Use IDs such as `customer_id`, `session_id`, and `case_id`.

## 6. Supabase database, RLS, seed, and Edge Functions (`supabase/**`, `tests/db`)

Run when editing migrations, RLS policies, seed data, storage buckets, Postgres functions, or Edge Functions.

Workflow:
1. `supabase start`
2. `supabase db reset`
3. `supabase test db`
4. `npm run db:types`
5. `npm run typecheck`

Edge Function workflow:
1. Keep function code under `supabase/functions/<name>`.
2. Test the route or webhook path that invokes the function.
3. Deploy only when explicitly needed:
   - `supabase functions deploy process-screening-webhook`
   - `supabase functions deploy process-idv-webhook`
   - `supabase functions deploy retry-failed-webhooks`
   - `supabase functions deploy compute-document-hash`

Security checks:
- Every tenant-scoped table must have RLS enabled.
- `audit_log` and `customer_data_versions` are append-only.
- Service role code must stay server-only; never import `lib/supabase/admin.ts` into browser/client components.

## 7. Operational and compliance checks

Run when touching audit, logging, SAR, case actions, webhooks, or operational behavior.

Workflow:
1. `npm run check:pii`
2. `npm run verify:audit-chain`
3. For webhook work, inspect `webhook_events` status counts after triggering a test event.
4. For health checks, call `/api/health` locally or on the target deployment.

## 8. Choosing the right evidence

- Docs-only or config-only change: inspect the rendered Markdown or run the narrowest available check.
- Unit-level domain change: run the focused unit test and `npm run typecheck`.
- UI change: run automated checks plus browser/manual verification of the changed flow.
- Authenticated or DB-backed change: reset local Supabase and exercise the full flow through the app, not only the module.
- Before final handoff, commit, push, and create/update the PR for the branch.

## 9. Updating this skill

Whenever a Cloud agent discovers a new reliable setup trick, seed credential, feature gate, local workaround, or test command:

1. Add it to the smallest relevant section above.
2. Include the exact command or UI path.
3. Note prerequisites and known skips, especially for Supabase, MFA, provider credentials, and E2E flags.
4. Keep the entry short and practical; link to full docs only when the detail does not fit here.
5. Validate the new instruction once before committing the skill update.
