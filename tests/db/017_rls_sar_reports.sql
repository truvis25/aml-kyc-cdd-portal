-- pgTAP test: sar_reports + sar_reference_counters
-- Source: migration 0036_sar_reports.sql
--
-- SAR records are tipping-off-sensitive: only mlro and tenant_admin may read or
-- write. Analysts and senior_reviewers must be intentionally blind. There is
-- intentionally no DELETE policy — SARs are retained for the regulatory
-- window and may only be purged out-of-band by service-role retention jobs.

BEGIN;
SELECT plan(12);

-- Table presence and RLS enabled
SELECT has_table('public', 'sar_reports', 'sar_reports table exists');
SELECT has_table('public', 'sar_reference_counters', 'sar_reference_counters table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sar_reports'::regclass),
  'sar_reports has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sar_reference_counters'::regclass),
  'sar_reference_counters has RLS enabled'
);

-- Tipping-off policy: read restricted to mlro + tenant_admin
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND policyname = 'sar_reports_read'
  ),
  'sar_reports_read policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND policyname = 'sar_reports_write'
  ),
  'sar_reports_write (INSERT) policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND policyname = 'sar_reports_update'
  ),
  'sar_reports_update policy exists'
);

-- No DELETE policy is permitted (regulatory retention)
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'sar_reports'
       AND cmd = 'DELETE'
  ),
  'sar_reports has NO DELETE policy (regulatory retention)'
);

-- Status enum guards the lifecycle
SELECT col_has_check('public', 'sar_reports', 'status', 'sar_reports.status has CHECK constraint');

-- Reference number must be tenant-scoped unique (UNIQUE (tenant_id, reference_number))
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.sar_reports'::regclass
       AND contype = 'u'
       AND conkey @> ARRAY[
         (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.sar_reports'::regclass AND attname = 'tenant_id'),
         (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.sar_reports'::regclass AND attname = 'reference_number')
       ]::smallint[]
  ),
  'sar_reports has UNIQUE (tenant_id, reference_number) for monotonic per-tenant references'
);

-- Hot lookup indexes for the queues
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'sar_reports_tenant_idx'),
  'sar_reports_tenant_idx exists for queue ordering'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'sar_reports_status_idx'),
  'sar_reports_status_idx exists for status-filtered queries'
);

SELECT * FROM finish();
ROLLBACK;
