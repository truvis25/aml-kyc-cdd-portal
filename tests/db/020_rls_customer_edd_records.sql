-- pgTAP test: customer_edd_records
-- Source: migration 0038_customer_edd_records.sql
--
-- EDD records are visible only to roles holding `customers:read_edd_data`
-- (mlro, senior_reviewer, tenant_admin). Analysts and onboarding agents
-- must be intentionally blind. The table is append-only — UPDATE and
-- DELETE must fail at the trigger level.

BEGIN;
SELECT plan(11);

-- Table exists + RLS enabled
SELECT has_table('public', 'customer_edd_records', 'customer_edd_records table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.customer_edd_records'::regclass),
  'customer_edd_records has RLS enabled'
);

-- Read policy restricts to mlro / senior_reviewer / tenant_admin
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'customer_edd_records'
       AND policyname = 'customer_edd_records_read'
       AND cmd = 'SELECT'
  ),
  'customer_edd_records_read SELECT policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'customer_edd_records'
       AND policyname = 'customer_edd_records_insert'
       AND cmd = 'INSERT'
  ),
  'customer_edd_records_insert INSERT policy exists'
);

-- No UPDATE / DELETE policies — append-only.
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'customer_edd_records'
       AND cmd IN ('UPDATE', 'DELETE')
  ),
  'customer_edd_records has NO UPDATE/DELETE policies (append-only)'
);

-- Triggers enforce immutability at the DB level (defence in depth)
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'customer_edd_records_no_update'
       AND tgrelid = 'public.customer_edd_records'::regclass
  ),
  'customer_edd_records_no_update trigger present'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'customer_edd_records_no_delete'
       AND tgrelid = 'public.customer_edd_records'::regclass
  ),
  'customer_edd_records_no_delete trigger present'
);

-- CHECK constraints on narrative length (10-50000)
SELECT col_has_check(
  'public', 'customer_edd_records', 'source_of_wealth_narrative',
  'source_of_wealth_narrative has CHECK constraint'
);
SELECT col_has_check(
  'public', 'customer_edd_records', 'source_of_funds_narrative',
  'source_of_funds_narrative has CHECK constraint'
);

-- Per-customer version uniqueness
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.customer_edd_records'::regclass
       AND contype = 'u'
       AND conkey @> ARRAY[
         (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.customer_edd_records'::regclass AND attname = 'customer_id'),
         (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.customer_edd_records'::regclass AND attname = 'version')
       ]::smallint[]
  ),
  'customer_edd_records has UNIQUE (customer_id, version) for monotonic versioning'
);

-- Index for hot per-customer lookup
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'customer_edd_records_customer_idx'),
  'customer_edd_records_customer_idx exists for latest-record lookup'
);

SELECT * FROM finish();
ROLLBACK;
