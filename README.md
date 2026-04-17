# AML / KYC / CDD Portal

Compliance portal for Anti-Money Laundering, Know Your Customer, and Customer Due Diligence workflows.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Supabase Postgres + Auth · Tailwind CSS · Vercel (region: me1 Bahrain)

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in values from your local Supabase instance (see supabase start output)

# 3. Start local Supabase (requires Docker)
supabase start
supabase db reset   # runs migrations + seeds

# 4. Register JWT hook in local Supabase Studio (required once)
# http://localhost:54323 → Authentication → Hooks → Custom Access Token Hook
# → select: custom_access_token_hook → Save

# 5. Start dev server
npm run dev
```

Local admin credentials: `admin@truvis-test.local` / `AdminPass123!`

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run check` | Typecheck + lint + test (run before pushing) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests (Vitest) |
| `npm run validate:env` | Verify all required env vars are set |
| `npm run db:reset` | Reset local database (re-runs migrations + seeds) |
| `npm run db:push` | Push pending migrations to linked remote Supabase |
| `npm run db:push:dry` | Dry-run — show pending migrations without applying |
| `npm run db:types` | Regenerate TypeScript types from local schema |

---

## Project Structure

```
app/
  (auth)/           Sign-in, MFA setup
  (platform)/       Authenticated platform pages
  api/              API route handlers
modules/            Business logic (auth, audit, onboarding, ...)
lib/
  supabase/         Client factory (client.ts, server.ts, admin.ts)
  constants/        Roles, events, enums
  validations/      Zod schemas
components/         React components
supabase/
  migrations/       Sequential database migrations
  seed/             Local development seed data
  config.toml       Local Supabase configuration
docs/               Architecture and deployment documentation
```

---

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment runbook, environment setup, migration procedures
- [`docs/MILESTONE_CHECKLISTS.md`](docs/MILESTONE_CHECKLISTS.md) — Acceptance criteria per milestone
- [`docs/BUILD_ORDER.md`](docs/BUILD_ORDER.md) — Sequential build plan
- [`CLAUDE.md`](CLAUDE.md) — Architecture decisions and development rules

---

## Deployment

- **App:** Vercel deploys automatically on every push via GitHub integration. `main` → production.
- **Database:** Migrations are applied manually. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- **Region:** Vercel `me1` (Bahrain) — UAE data residency baseline.
