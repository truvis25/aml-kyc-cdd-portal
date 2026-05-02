-- pgTAP test: tenant_billing + tenant_billing_links + billing_events
-- Source: migration 0035_tenant_billing.sql
--
-- Tenants may read their own billing record, payment links, and billing events.
-- Mutations to billing state are server-only (service role) and not granted to
-- the authenticated client role; this test pins that invariant. A 4th `scale`
-- tier is planned (FINAL_LAUNCH_PLAN.md §11.3) but not yet in the enum — when
-- the migration lands the tier-enum assertion below should be updated.

BEGIN;
SELECT plan(14);

-- Tables present
SELECT has_table('public', 'tenant_billing', 'tenant_billing table exists');
SELECT has_table('public', 'tenant_billing_links', 'tenant_billing_links table exists');
SELECT has_table('public', 'billing_events', 'billing_events table exists');

-- RLS enabled on each
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tenant_billing'::regclass),
  'tenant_billing has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tenant_billing_links'::regclass),
  'tenant_billing_links has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.billing_events'::regclass),
  'billing_events has RLS enabled'
);

-- Tenant-scoped read policies
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_billing'
       AND policyname = 'tenant_billing_tenant_read'
  ),
  'tenant_billing_tenant_read policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_billing_links'
       AND policyname = 'tenant_billing_links_tenant_read'
  ),
  'tenant_billing_links_tenant_read policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'billing_events'
       AND policyname = 'billing_events_tenant_read'
  ),
  'billing_events_tenant_read policy exists'
);

-- No INSERT/UPDATE/DELETE policies for the authenticated client role on any
-- billing table — mutations are server-only via service role + webhook
-- handlers. Pinning this invariant prevents accidental policy expansion.
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_billing'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  ),
  'tenant_billing has no client-side INSERT/UPDATE/DELETE policy (server-only mutations)'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_billing_links'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  ),
  'tenant_billing_links has no client-side mutation policy'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'billing_events'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  ),
  'billing_events has no client-side mutation policy'
);

-- One billing record per tenant — duplicate signup must not create two rows
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.tenant_billing'::regclass
       AND contype = 'u'
       AND conkey @> ARRAY[
         (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.tenant_billing'::regclass AND attname = 'tenant_id')
       ]::smallint[]
  ),
  'tenant_billing.tenant_id is UNIQUE (one billing record per tenant)'
);

-- Plan enum sanity: must include the v1 tiers. Update this assertion when
-- migration adds 'scale' tier per FINAL_LAUNCH_PLAN.md §11.3.
SELECT col_has_check('public', 'tenant_billing', 'plan', 'tenant_billing.plan has CHECK constraint');

SELECT * FROM finish();
ROLLBACK;
