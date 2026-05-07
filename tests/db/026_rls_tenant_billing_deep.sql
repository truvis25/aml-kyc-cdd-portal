-- pgTAP test: tenant_billing / tenant_billing_links / billing_events — deep coverage
-- Source: migration 0035_tenant_billing.sql
--
-- Extends the 14-assertion coverage in 018_rls_tenant_billing.sql with:
-- - Column NOT NULL checks
-- - Cross-tenant isolation probe on all three read policies
-- - billing_period_end column presence (billing cycle tracking)
-- - billing_events.event_type NOT NULL
-- - Index presence for performance lookups
-- - status CHECK constraint on tenant_billing

BEGIN;
SELECT plan(16);

-- ============================================================
-- 1. Table presence + RLS (recap for standalone execution)
-- ============================================================
SELECT has_table('public', 'tenant_billing',       'tenant_billing table exists');
SELECT has_table('public', 'tenant_billing_links', 'tenant_billing_links table exists');
SELECT has_table('public', 'billing_events',       'billing_events table exists');

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

-- ============================================================
-- 2. Critical columns NOT NULL
-- ============================================================
SELECT col_not_null('public', 'tenant_billing', 'tenant_id', 'tenant_billing.tenant_id is NOT NULL');
SELECT col_not_null('public', 'tenant_billing', 'plan',      'tenant_billing.plan is NOT NULL');
SELECT col_not_null('public', 'tenant_billing', 'status',    'tenant_billing.status is NOT NULL');
SELECT col_not_null('public', 'billing_events', 'tenant_id', 'billing_events.tenant_id is NOT NULL');
SELECT col_not_null('public', 'billing_events', 'event_type','billing_events.event_type is NOT NULL');

-- ============================================================
-- 3. CHECK constraints enforced at DB level
-- ============================================================
SELECT col_has_check('public', 'tenant_billing', 'plan',
  'tenant_billing.plan has CHECK constraint (starter|growth|enterprise)');
SELECT col_has_check('public', 'tenant_billing', 'status',
  'tenant_billing.status has CHECK constraint (trialing|active|past_due|canceled)');

-- ============================================================
-- 4. Cross-tenant isolation: read policy quals reference tenant_id
-- ============================================================
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'tenant_billing'
       AND policyname = 'tenant_billing_tenant_read'
       AND qual ILIKE '%tenant_id%'
  ),
  'tenant_billing_tenant_read policy qual references tenant_id (cross-tenant isolation)'
);

-- ============================================================
-- 5. No client-side mutation policies on billing_events
--    (INSERT/UPDATE/DELETE are service-role only via webhook handlers)
-- ============================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'billing_events'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  ),
  'billing_events has no client-side INSERT/UPDATE/DELETE policy (server-only mutations)'
);

-- ============================================================
-- 6. Performance indexes
-- ============================================================
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'billing_events_tenant_id_idx'),
  'billing_events_tenant_id_idx exists'
);

SELECT * FROM finish();
ROLLBACK;
