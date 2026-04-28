-- pgTAP test: workflow_activation_acks + assert_workflow_ack trigger
-- Source: migration 0031

BEGIN;
SELECT plan(6);

SELECT has_table_privilege(
  'authenticated', 'workflow_activation_acks', 'INSERT',
  'authenticated has INSERT on workflow_activation_acks'
);

-- DELETE blocked by trigger.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_workflow_ack_delete'
       AND tgrelid = 'public.workflow_activation_acks'::regclass
  ),
  'no_workflow_ack_delete trigger present'
);

-- Restricted UPDATE trigger present.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'restrict_workflow_ack_update'
       AND tgrelid = 'public.workflow_activation_acks'::regclass
  ),
  'restrict_workflow_ack_update trigger present'
);

-- Activation gate trigger present on workflow_definitions.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'enforce_workflow_activation_ack'
       AND tgrelid = 'public.workflow_definitions'::regclass
  ),
  'enforce_workflow_activation_ack trigger on workflow_definitions'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'enforce_workflow_activation_ack_insert'
       AND tgrelid = 'public.workflow_definitions'::regclass
  ),
  'enforce_workflow_activation_ack_insert trigger on workflow_definitions'
);

-- Acknowledgement insert policy is restricted to mlro / tenant_admin /
-- platform_super_admin (see policy in 0031).
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'workflow_activation_acks'
       AND policyname = 'workflow_acks_insert_mlro'
  ),
  'workflow_acks_insert_mlro policy exists'
);

SELECT * FROM finish();
ROLLBACK;
