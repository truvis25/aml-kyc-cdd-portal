-- pgTAP test: approvals — immutability + RLS
-- Source: migration 0016

BEGIN;
SELECT plan(5);

SELECT ok(
  has_table_privilege('authenticated', 'approvals', 'SELECT'),
  'authenticated has SELECT on approvals'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'approvals'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on approvals'
);

-- Immutability triggers
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_approval_update'
       AND tgrelid = 'public.approvals'::regclass
  ),
  'no_approval_update trigger blocks UPDATE'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_approval_delete'
       AND tgrelid = 'public.approvals'::regclass
  ),
  'no_approval_delete trigger blocks DELETE'
);

-- INSERT policy restricts to MLRO / tenant_admin / platform_super_admin.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'approvals'
       AND policyname = 'approvals_insert_mlro'
  ),
  'approvals_insert_mlro policy exists'
);

SELECT * FROM finish();
ROLLBACK;
