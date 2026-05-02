-- pgTAP test: tenant_config — versioned, append-only
-- Source: migration 0030

BEGIN;
SELECT plan(5);

SELECT ok(
  has_table_privilege('authenticated', 'tenant_config', 'SELECT'),
  'authenticated has SELECT on tenant_config'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_config'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on tenant_config'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_tenant_config_update'
       AND tgrelid = 'public.tenant_config'::regclass
  ),
  'no_tenant_config_update trigger blocks UPDATE'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_tenant_config_delete'
       AND tgrelid = 'public.tenant_config'::regclass
  ),
  'no_tenant_config_delete trigger blocks DELETE'
);

-- Convenience view for "latest config per tenant" exists.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_views
     WHERE schemaname = 'public' AND viewname = 'tenant_config_latest'
  ),
  'tenant_config_latest view exists'
);

SELECT * FROM finish();
ROLLBACK;
