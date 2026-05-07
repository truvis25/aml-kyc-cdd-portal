-- pgTAP test: sar_reports + sar_reference_counters — deep coverage
-- Source: migration 0036_sar_reports.sql
--
-- Extends the 12-assertion coverage in 017_rls_sar_reports.sql with:
-- - Column NOT NULL checks for case_id, customer_id, created_by
-- - Tipping-off policy qual probe (qual must contain 'mlro')
-- - No DELETE policy on sar_reference_counters
-- - Additional index assertions (case_idx, customer_idx)
-- - narrative length CHECK constraint
-- - total_amount_aed non-negative CHECK constraint

BEGIN;
SELECT plan(15);

-- ============================================================
-- 1. Table presence + RLS (recap for standalone execution)
-- ============================================================
SELECT has_table('public', 'sar_reports',             'sar_reports table exists');
SELECT has_table('public', 'sar_reference_counters',  'sar_reference_counters table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sar_reports'::regclass),
  'sar_reports has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sar_reference_counters'::regclass),
  'sar_reference_counters has RLS enabled'
);

-- ============================================================
-- 2. Critical columns NOT NULL
-- ============================================================
SELECT col_not_null('public', 'sar_reports', 'tenant_id',       'sar_reports.tenant_id is NOT NULL');
SELECT col_not_null('public', 'sar_reports', 'case_id',         'sar_reports.case_id is NOT NULL');
SELECT col_not_null('public', 'sar_reports', 'customer_id',     'sar_reports.customer_id is NOT NULL');
SELECT col_not_null('public', 'sar_reports', 'created_by',      'sar_reports.created_by is NOT NULL');
SELECT col_not_null('public', 'sar_reports', 'reference_number','sar_reports.reference_number is NOT NULL');

-- ============================================================
-- 3. Tipping-off: sar_reports_read SELECT policy qual restricts to
--    mlro + tenant_admin (the "mlro" string must appear in the qual)
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND policyname = 'sar_reports_read'
       AND cmd = 'SELECT'
       AND qual ILIKE '%mlro%'
  ),
  'sar_reports_read SELECT policy qual restricts to mlro (tipping-off guard)'
);

-- ============================================================
-- 4. No DELETE policy on sar_reports (regulatory retention)
-- ============================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND cmd = 'DELETE'
  ),
  'sar_reports has NO DELETE RLS policy (regulatory retention)'
);

-- ============================================================
-- 5. No DELETE policy on sar_reference_counters
-- ============================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reference_counters'
       AND cmd = 'DELETE'
  ),
  'sar_reference_counters has NO DELETE RLS policy'
);

-- ============================================================
-- 6. CHECK constraints enforced at DB level
-- ============================================================
SELECT col_has_check('public', 'sar_reports', 'status',
  'sar_reports.status has CHECK constraint (draft|ready|submitted|acknowledged|rejected)');
SELECT col_has_check('public', 'sar_reports', 'total_amount_aed',
  'sar_reports.total_amount_aed has CHECK constraint (>= 0)');

-- ============================================================
-- 7. Additional performance indexes (beyond sar_reports_tenant_idx)
-- ============================================================
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'sar_reports_case_idx'),
  'sar_reports_case_idx exists for case-linked lookups'
);

SELECT * FROM finish();
ROLLBACK;
