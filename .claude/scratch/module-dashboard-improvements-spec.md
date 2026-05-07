# Module Spec — dashboard-improvements (S1-03)

## Slug
`dashboard-improvements`

## Risk tag
`NONE`

## Sheets module name
`Dashboards`

## Branch
`feat/dashboard-improvements`

## Dispatch
Frontend Dev only (FE-only — no migrations, no RLS changes)

## Problem
All 7 role dashboards are built but per §4 of FINAL_LAUNCH_PLAN.md they need
targeted enhancements: sparklines on remaining dashboards, filter pills, deep-links,
RAI inbox, resume deep-links, customer search, month-over-month deltas, time range
selector, cross-tenant health table.

## Widgets already available (reuse, do not rebuild)
- `components/dashboards/widgets/sparkline.tsx` — SVG sparkline
- `components/dashboards/widgets/stat-card-with-sparkline.tsx` — stat card + sparkline
- `components/dashboards/widgets/stat-card.tsx` — plain stat card
- `components/dashboards/widgets/period-toggle.tsx` — today/week/month toggle
- `components/dashboards/widgets/completeness-card.tsx` — setup completeness
- `components/dashboards/widgets/skeleton.tsx` — loading skeleton
- `components/dashboards/widgets/empty-state.tsx` — empty state
- `components/dashboards/widgets/error-card.tsx` — error boundary
- `components/dashboards/widgets/queue-summary.tsx` — queue summary card
- `modules/dashboards/queries.ts` — existing Supabase queries

## Per-dashboard improvements (§4)

### 4.1 Platform Super Admin (`/admin/platform`)
- Replace "Cross-tenant view pending" placeholder with real cross-tenant health table
  (columns: Tenant, Open Cases, Sessions Today, Last Activity, Queue Depth)
- Webhook delivery success rate per tenant (24h / 7d)

### 4.2 Tenant Admin
- Already has: PeriodToggle + sparklines + CompletenessCard ✅
- Add: outstanding invitations count with "re-send" deep-link (`/admin/users`)
- Add: "Today / Week / Month" toggle already wired — verify page searchParams pass through

### 4.3 MLRO
- Already has: StatCardWithSparkline ✅
- Add: "SAR drafts pending submission" stat card linking to `/sar?status=draft`
- Add: Quick filter pills for queue navigation: High-Risk / EDD / Escalations / SAR
- Add: "Cases overdue" count (cases where updated_at > 48h ago and status = open)

### 4.4 Senior Reviewer
- Add: "My average decision time" personal stat (avg hours from assigned→decided)
- Add: Cases I escalated upstream + their current status (list, 5 items, deep-link)

### 4.5 Analyst
- Add: "Pending RAI responses" count with received-since-last-login badge
- Add: Document inbox (newly uploaded docs on my cases, deep-link to verify)
- Add: Personal SLA gauge (% of my cases resolved within SLA)

### 4.6 Onboarding Agent
- Add: "Resume session" deep-links list (top 5 in-progress sessions, deep-link to session)
- Add: Customer lookup search box (client component, navigates to `/cases?search=<q>`)

### 4.7 Read-Only
- Add: Month-over-month delta badges on every metric card
- Add: Time range selector (last 30 / 90 / YTD) as a PeriodToggle variant
- Add: Export-to-CSV button on each widget (client component, downloads JSON→CSV)

## Acceptance criteria
- [ ] All 7 dashboards render without errors (no runtime exceptions)
- [ ] Platform Admin shows cross-tenant health table with real data shape
- [ ] MLRO filter pills are rendered and pass query params to case list
- [ ] Analyst shows pending RAI count and doc inbox list
- [ ] Onboarding Agent shows resume-session links and customer search box
- [ ] Read-Only shows MoM deltas and time range selector
- [ ] No PII in component props passed to client components
- [ ] TypeScript strict: zero type errors (`npx tsc --noEmit`)
- [ ] ESLint: zero errors

## Notes for Frontend Dev
- All new server queries go in `modules/dashboards/queries.ts`
- Use existing Tailwind tokens — no new CSS files
- Client components (search box, export button) must be in separate `*-client.tsx` files
  with `'use client'` directive
- Supabase client in server components: `createClient()` from `lib/supabase/server.ts`
- No PII surfacing on Read-Only dashboard — use aggregate counts only
