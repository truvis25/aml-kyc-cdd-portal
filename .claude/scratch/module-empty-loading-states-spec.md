# Module Spec — empty-loading-states

## Goal

Audit every list page and data-heavy page in the AML/KYC/CDD Portal and implement
consistent, production-ready empty states and loading states for each. Compliance portals
must never show a blank screen or spinner-only UI — every list must communicate whether
data is loading, empty due to filters, or genuinely absent.

## Acceptance Criteria

1. Every page that renders a list (cases, customers/sessions, SAR, audit, documents,
   screening hits, notifications, admin user list, tenant list) has:
   a. A **skeleton loader** (Tailwind animate-pulse) displayed during initial data fetch.
   b. An **empty state** component when the list resolves to zero results, with:
      - An icon or illustration (use a Heroicons/Radix icon — no new image assets).
      - A contextually relevant heading ("No cases yet", "No open screening hits", etc.).
      - A sub-line explaining why it might be empty + a primary CTA (e.g., "Start an onboarding" → `/onboarding/new`).
   c. An **error state** (data fetch failed) with a retry button.
2. Skeleton loaders must match the shape of the real content (table rows for tables,
   card skeletons for card grids).
3. Empty-state components are reusable — a single `<EmptyState>` primitive in
   `components/ui/empty-state.tsx` accepts `icon`, `title`, `description`, `action`.
4. Loading skeleton is a reusable `<TableSkeleton rows={n}>` in
   `components/ui/table-skeleton.tsx` and a `<CardSkeleton>` in
   `components/ui/card-skeleton.tsx`.
5. All states render correctly at 1280px and 1920px desktop widths and 375px mobile.
6. No new API routes or DB changes required — this is pure UI state.
7. Storybook/visual regression not required for this sprint — visual review via PR
   screenshots is sufficient.

## Pages in Scope

| Page | Route | Current state |
|---|---|---|
| Cases list | `/cases` | Spinner only |
| Case queue (MLRO/SR) | `/cases?queue=mlro` | Spinner only |
| Customers / sessions | `/customers` or `/sessions` | Unknown |
| SAR register | `/sar` | Spinner only |
| Audit log | `/audit` | Spinner only |
| Documents | `/documents` | Unknown |
| Screening hits | Inside case detail | Unknown |
| Notifications | `/notifications` | Unknown |
| Admin: user list | `/admin/config` → users tab | Unknown |
| Admin: tenant list | `/admin/platform` → tenants tab | Unknown |
| Onboarding sessions (agent view) | `/onboarding` | Unknown |
| Risk assessments | Inside case detail | Unknown |

## DB Changes

None.

## API Surface

None — all changes are client-side React components consuming existing data fetches.

## UI Surface

New shared components:
- `components/ui/empty-state.tsx` — `<EmptyState icon title description action? />`
- `components/ui/table-skeleton.tsx` — `<TableSkeleton rows cols />`
- `components/ui/card-skeleton.tsx` — `<CardSkeleton />`

Updates to existing page/component files for each route in scope.

## Risk Tag

NONE

## Open Questions

- Q1: Does `/customers` exist as a distinct route or is it embedded in `/cases`? Audit
  during implementation and document findings.
- Q2: Are documents surfaced as a top-level nav item or only in case detail tabs? Apply
  empty/loading states to both surfaces if both exist.
- Q3: Some pages may use Supabase Realtime — ensure skeleton shows during initial
  Realtime channel setup, not just on HTTP fetch.
