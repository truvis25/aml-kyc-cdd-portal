-- pgTAP test: uae_pass_authentications
-- Source: migration 0041_uae_pass_authentications.sql

BEGIN;
SELECT plan(11);

-- Table exists + RLS enabled
SELECT has_table('public', 'uae_pass_authentications', 'uae_pass_authentications table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.uae_pass_authentications'::regclass),
  'uae_pass_authentications has RLS enabled'
);

-- Tenant-scoped policies (SELECT/INSERT/UPDATE)
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'uae_pass_authentications'
       AND policyname = 'uae_pass_authentications_tenant_select'
       AND cmd = 'SELECT'
  ),
  'tenant_select policy exists'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'uae_pass_authentications'
       AND policyname = 'uae_pass_authentications_tenant_insert'
       AND cmd = 'INSERT'
  ),
  'tenant_insert policy exists'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'uae_pass_authentications'
       AND policyname = 'uae_pass_authentications_tenant_update'
       AND cmd = 'UPDATE'
  ),
  'tenant_update policy exists'
);

-- No DELETE policy — rows stay for audit
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'uae_pass_authentications'
       AND cmd = 'DELETE'
  ),
  'uae_pass_authentications has NO DELETE policy'
);

-- CHECK constraints on lifecycle invariants
SELECT col_has_check(
  'public', 'uae_pass_authentications', 'state',
  'state has CHECK constraint (length 32–256)'
);
SELECT col_has_check(
  'public', 'uae_pass_authentications', 'required_assurance_level',
  'required_assurance_level has CHECK constraint (SOP2/SOP3)'
);
SELECT col_has_check(
  'public', 'uae_pass_authentications', 'status',
  'status has CHECK constraint (initiated/succeeded/failed/expired)'
);

-- state is uniquely indexed (cannot be replayed)
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.uae_pass_authentications'::regclass
       AND contype = 'u'
       AND conkey @> ARRAY[
         (SELECT attnum FROM pg_attribute
            WHERE attrelid = 'public.uae_pass_authentications'::regclass AND attname = 'state')
       ]::smallint[]
  ),
  'state has a UNIQUE constraint'
);

-- Lookup index for the callback's state-driven read path
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uae_pass_authentications_state_idx'),
  'uae_pass_authentications_state_idx exists'
);

SELECT * FROM finish();
ROLLBACK;
