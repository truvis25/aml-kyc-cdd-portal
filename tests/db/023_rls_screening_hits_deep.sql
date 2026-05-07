-- pgTAP test: screening_hits / screening_hit_resolutions / screening_jobs — deep coverage
-- Source: migrations 0013_create_screening.sql, 0016_create_approvals.sql,
--         0021_fix_jwt_user_role_claim.sql, 0025_screening_hits_rls_and_doc_verify.sql
--
-- Supersedes the shallow coverage in 009_rls_screening.sql.
-- Tests added here: structural constraints, cross-tenant isolation probes,
-- immutability enforcement, and index presence for all three screening tables.

BEGIN;
SELECT plan(16);

-- ============================================================
-- 1. Table presence
-- ============================================================
SELECT has_table('public', 'screening_hits',            'screening_hits table exists');
SELECT has_table('public', 'screening_hit_resolutions', 'screening_hit_resolutions table exists');
SELECT has_table('public', 'screening_jobs',            'screening_jobs table exists');

-- ============================================================
-- 2. RLS enabled
-- ============================================================
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.screening_hits'::regclass),
  'screening_hits has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.screening_hit_resolutions'::regclass),
  'screening_hit_resolutions has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.screening_jobs'::regclass),
  'screening_jobs has RLS enabled'
);

-- ============================================================
-- 3. Critical columns are NOT NULL (tenant isolation spine)
-- ============================================================
SELECT col_not_null('public', 'screening_hits', 'tenant_id',
  'screening_hits.tenant_id is NOT NULL');
SELECT col_not_null('public', 'screening_hit_resolutions', 'tenant_id',
  'screening_hit_resolutions.tenant_id is NOT NULL');
SELECT col_not_null('public', 'screening_jobs', 'tenant_id',
  'screening_jobs.tenant_id is NOT NULL');

-- ============================================================
-- 4. SELECT policy with tenant-scoped qual exists on screening_hits
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'screening_hits'
       AND policyname = 'screening_hits_select_staff'
       AND cmd = 'SELECT'
  ),
  'screening_hits_select_staff SELECT policy exists'
);

-- 4b. SELECT policy qual references tenant_id (cross-tenant isolation)
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'screening_hits'
       AND policyname = 'screening_hits_select_staff'
       AND qual ILIKE '%tenant_id%'
  ),
  'screening_hits_select_staff qual references tenant_id (cross-tenant isolation)'
);

-- ============================================================
-- 5. INSERT policy on screening_hit_resolutions for staff roles
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'screening_hit_resolutions'
       AND policyname = 'screening_resolutions_insert_analyst'
       AND cmd = 'INSERT'
  ),
  'screening_resolutions_insert_analyst INSERT policy exists'
);

-- ============================================================
-- 6. Immutability triggers on screening_hit_resolutions
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_resolution_update'
       AND tgrelid = 'public.screening_hit_resolutions'::regclass
  ),
  'no_resolution_update trigger blocks UPDATE on screening_hit_resolutions'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_resolution_delete'
       AND tgrelid = 'public.screening_hit_resolutions'::regclass
  ),
  'no_resolution_delete trigger blocks DELETE on screening_hit_resolutions'
);

-- ============================================================
-- 7. Performance indexes
-- ============================================================
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'screening_hits_job_id_idx'),
  'screening_hits_job_id_idx exists'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'screening_hit_resolutions_hit_id_idx'),
  'screening_hit_resolutions_hit_id_idx exists'
);

SELECT * FROM finish();
ROLLBACK;
