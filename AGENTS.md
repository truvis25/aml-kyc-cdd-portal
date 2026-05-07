<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## TRUVIS DevOs Team — Agent Roster

This project uses the TRUVIS DevOs Team multi-subagent workflow. The following agents
are available under `.claude/agents/`:

| Agent | Role |
|---|---|
| `tech-lead` | Single entry point — triages all signals and dispatches specialists |
| `architect` | Called by Tech Lead only for escalation triggers or auth/privacy/payment surfaces |
| `backend-dev` | Supabase migrations, RLS, API routes, Edge Functions, audit logging |
| `frontend-dev` | Next.js pages, React components, Tailwind CSS, Radix UI |
| `qa-engineer` | Regression suite, adversarial scenarios, riskTag blocking |
| `docs-sync` | CLAUDE.md anchors, launch checklist, PR description sync |

Run `/develop-next-module` to start the full per-module cycle via Tech Lead.

## Setup (Cloud Agent / fresh session)

Run `bash scripts/cloud-agent-setup.sh` before launch-readiness work in a fresh
Cloud Agent. It installs/validates Node 22, npm dependencies, Supabase CLI,
Playwright Chromium, and Docker daemon availability for local Supabase + E2E
testing.

## Phase-0 gate

```bash
npm run check:foundations
```

This must pass before any development work starts. If it fails, address the
missing foundations listed in the output before proceeding.

## DB seed credentials (local Supabase)

- Admin: `admin@truvis-test.local` / `AdminPass123!`
- Analyst: `analyst@truvis-test.local` / `TestPass123!`
- Senior Reviewer: `sr@truvis-test.local` / `TestPass123!`
- Onboarding Agent: `agent@truvis-test.local` / `TestPass123!`
- Read-only: `readonly@truvis-test.local` / `TestPass123!`

## Critical invariants for all agents

- `lib/supabase/admin.ts` (service role) must NEVER be imported in `app/` — `modules/` only
- Every table needs RLS enabled with explicit policies
- `audit_log` and `customer_data_versions` are append-only — no UPDATE or DELETE
- No PII in logs — use `customer_id`, `session_id`, `case_id` only
- Signed URLs: max 15 minutes, never cache
- JWT enrichment via `custom_access_token_hook` (migration 0005) — not an Edge Function
