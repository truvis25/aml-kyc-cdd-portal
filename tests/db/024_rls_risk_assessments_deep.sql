-- pgTAP test: risk_assessments — deep coverage
-- Source: migration 0014_create_risk.sql
--
-- Supersedes the shallow 4-assertion coverage in 008_rls_risk_assessments.sql.
-- Tests added here: structural constraints, RLS policy qual probe,
-- column NOT NULL checks, CHECK constraint verification, and indexes.

BEGIN;
SELECT plan(14);

-- ============================================================
-- 1. Table presence + RLS
-- ============================================================
SELECT has_table('public', 'risk_assessments', 'risk_assessments table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.risk_assessments'::regclass),
  'risk_assessments has RLS enabled'
);

-- ============================================================
-- 2. Critical columns NOT NULL (tenant isolation spine + audit trail)
-- ============================================================
SELECT col_not_null('public', 'risk_assessments', 'tenant_id',
  'risk_assessments.tenant_id is NOT NULL');
SELECT col_not_null('public', 'risk_assessments', 'customer_id',
  'risk_assessments.customer_id is NOT NULL');
SELECT col_not_null('public', 'risk_assessments', 'composite_score',
  'risk_assessments.composite_score is NOT NULL');
SELECT col_not_null('public', 'risk_assessments', 'assessed_at',
  'risk_assessments.assessed_at is NOT NULL');

-- ============================================================
-- 3. CHECK constraint on risk_band (valid enum values enforced at DB level)
-- ============================================================
SELECT col_has_check('public', 'risk_assessments', 'risk_band',
  'risk_assessments.risk_band has CHECK constraint (low|medium|high|unacceptable)');

-- ============================================================
-- 4. Immutability triggers
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_risk_update'
       AND tgrelid = 'public.risk_assessments'::regclass
  ),
  'no_risk_update trigger blocks UPDATE on risk_assessments'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_risk_delete'
       AND tgrelid = 'public.risk_assessments'::regclass
  ),
  'no_risk_delete trigger blocks DELETE on risk_assessments'
);

-- ============================================================
-- 5. SELECT policy exists and its qual references tenant_id
--    (cross-tenant isolation probe)
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'risk_assessments'
       AND cmd = 'SELECT'
  ),
  'At least one SELECT policy exists on risk_assessments'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'risk_assessments'
       AND cmd = 'SELECT'
       AND qual ILIKE '%tenant_id%'
  ),
  'risk_assessments SELECT policy qual references tenant_id (cross-tenant isolation)'
);

-- ============================================================
-- 6. No DELETE policy — risk history is immutable (trigger is the guard,
--    but there should be no explicit DELETE RLS policy either)
-- ============================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'risk_assessments'
       AND cmd = 'DELETE'
  ),
  'risk_assessments has NO DELETE RLS policy (immutability enforced by trigger)'
);

-- ============================================================
-- 7. Performance indexes
-- ============================================================
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'risk_assessments_latest_idx'),
  'risk_assessments_latest_idx exists for hot latest-per-customer lookups'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'risk_assessments_tenant_id_idx'),
  'risk_assessments_tenant_id_idx exists'
);

SELECT * FROM finish();
ROLLBACK;
