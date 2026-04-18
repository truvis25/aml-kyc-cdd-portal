# AML / KYC / CDD Portal

Compliance portal for Anti-Money Laundering (AML), Know Your Customer (KYC), and Customer Due Diligence (CDD) workflows.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Supabase Postgres + Auth · Tailwind CSS v4 · Vercel (`me1`)

---

## Quick Start

```bash
npm install
cp .env.example .env.local
supabase start
supabase db reset
npm run dev
```

Then register the JWT hook once in local Supabase Studio:

`Authentication → Hooks → Custom Access Token Hook → public.custom_access_token_hook`

Local admin credentials (seed): `admin@truvis-test.local` / `AdminPass123!`

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local app |
| `npm run build` | Production build check |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests |
| `npm run check` | Typecheck + lint + test |
| `npm run validate:env` | Environment sanity check |
| `npm run db:reset` | Reset local DB and run migrations/seeds |
| `npm run db:push:dry` | Show pending remote migrations |
| `npm run db:push` | Apply pending remote migrations |

---

## Architecture

- `app/` — Next.js App Router pages + API routes
- `modules/` — domain/business logic
- `components/` — UI components
- `lib/supabase/` — browser/server/admin Supabase clients
- `supabase/migrations/` — ordered SQL migrations
- `tests/unit/` — Vitest unit tests
- `tests/db/` — pgTAP database tests

---

## Deployment Model

- **Application deploys:** handled by Vercel GitHub integration.
- **Database migrations:** intentionally manual via GitHub Actions workflow (`Database Migrations`).
- **Region:** Bahrain (`me1`) for UAE/GCC data residency baseline.

See `docs/DEPLOYMENT.md` for full runbook.

---

## Security/Compliance Notes

- JWT enrichment is done via Postgres Custom Access Token Hook (`custom_access_token_hook`).
- RLS is required on tenant-scoped tables.
- Audit log is append-only and immutable.
- Service-role usage is restricted to server-only boundaries.

---

## Legacy Directories

`backend/` and `frontend/` remain in the repository as legacy artifacts and are not part of the active Next.js 16 + Supabase runtime path.
