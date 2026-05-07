# Module Spec — marketing-competitor-cleanup (S1-01 + S1-02)

## Slug
`marketing-competitor-cleanup`

## Risk tag
`NONE`

## Sheets module name
`Customer Onboarding` (landing / marketing surfaces)

## Problem
The portal had per-vendor comparison pages (`/compare/sumsub`, `/compare/azakaw`) that
named competitor products on customer-facing surfaces — a brand/legal liability. The
S1-01 and S1-02 checklist items called this out as P0 urgency.

## What was done (already shipped to main)

### S1-01 — Strip competitor names from marketing surfaces
- `app/(marketing)/compare/page.tsx` — generic category headings only
  ("vs global IDV platforms", "vs regional GCC compliance suites"); no vendor names
- `app/(marketing)/` landing page — comparison teaser cards use generic labels only,
  both linking to `/compare`
- Nav and Footer — zero competitor name references
- **Permitted surface**: `app/(marketing)/legal/sub-processors/page.tsx` correctly
  retains "Sumsub" as the sole permitted occurrence (PDPL/GDPR mandated processor
  disclosure)

### S1-02 — Collapse per-vendor compare pages into `/compare`
- `next.config.ts` lines 33-34: 301 permanent redirects
  - `/compare/sumsub` → `/compare`
  - `/compare/azakaw` → `/compare`
- No separate per-vendor page files exist

### E2E coverage
- `tests/e2e/marketing/landing.spec.ts` — asserts no sumsub/azakaw on landing page
- `tests/e2e/marketing/compare.spec.ts` — asserts no competitor names on `/compare`,
  and that `/compare/sumsub` + `/compare/azakaw` each return 301 to `/compare`
- `tests/e2e/marketing/legal.spec.ts` — asserts Sumsub IS visible on sub-processors
  page (permitted disclosure)

## Acceptance criteria (all met)
- [x] `/compare` page contains zero references to "sumsub" or "azakaw"
- [x] `/compare/sumsub` returns 301 → `/compare`
- [x] `/compare/azakaw` returns 301 → `/compare`
- [x] Landing page contains zero references to competitor names
- [x] Sub-processors page correctly lists Sumsub as data processor (GDPR/PDPL)
- [x] E2E tests confirm all of the above

## Status
Shipped — verified via codebase audit. PR documents and marks checklist items.
