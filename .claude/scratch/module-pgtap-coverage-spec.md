# Module Spec — pgtap-coverage (S1-06)

## Goal

Extend the pgTAP database test suite with deeper coverage for four high-risk
tables called out in FINAL_LAUNCH_PLAN.md §9 (S1-06):
`screening_hits`, `risk_assessments`, `sar_reports`, and `tenant_billing`.

Existing tests 008/009 are shallow (4 and 7 assertions). Tests 017/018 are
better but do not probe cross-tenant data isolation at the data level.

This module adds:
- Deeper structural / constraint assertions for all four tables.
- Cross-tenant isolation probes (wrong-tenant rows not readable via policy qual).
- Immutability / append-only enforcement tests (triggers present).
- Index presence assertions for performance-critical lookups.
- Role-gate assertions (analyst vs MLRO vs service-role).

## Acceptance Criteria

1. `supabase test db` runs all new files without failure (zero not-ok lines).
2. Each of the four table groups has >= 10 pgTAP assertions.
3. No existing test files modified (additive only).
4. `npm run check:foundations` still passes.
5. CI gate (`npm run check`) passes.

## DB Changes

None. Adds pgTAP test SQL files only — no new migrations.

## API Surface

None.

## UI Surface

None.

## Risk Tag

NONE

## Files Created

| File | Assertions | Description |
|---|---|---|
| `tests/db/023_rls_screening_hits_deep.sql` | 16 | screening_hits/resolutions/jobs — cross-tenant, immutability, indexes |
| `tests/db/024_rls_risk_assessments_deep.sql` | 14 | risk_assessments — cross-tenant, append-only, constraints, indexes |
| `tests/db/025_rls_sar_reports_deep.sql` | 15 | sar_reports — tipping-off role gates, no-delete, ref counter integrity |
| `tests/db/026_rls_tenant_billing_deep.sql` | 16 | tenant_billing — no client mutations, plan enum, one-per-tenant |

Total: 61 new assertions across 4 files.

## Dispatch

Backend Dev only (DB-only changes, no API or UI surface).
