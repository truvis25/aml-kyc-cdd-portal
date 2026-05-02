-- pgTAP test: cases table — RLS, append patterns
-- Run with: supabase test db
-- Source: migration 0015, RLS policies in 0016/0024

BEGIN;
SELECT plan(6);

-- Authenticated reads cases scoped to tenant.
SELECT ok(
  has_table_privilege('authenticated', 'cases', 'SELECT'),
  'authenticated has SELECT privilege on cases'
);

-- Authenticated must NOT have DELETE — cases are never hard-deleted.
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'cases'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on cases'
);

-- Confirm RLS is enabled on cases.
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'cases'),
  'cases table has RLS enabled'
);

-- Read policy gates by tenant_id + (assigned_to OR privileged role).
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'cases'
       AND policyname = 'cases_select_analyst'
  ),
  'cases_select_analyst policy exists'
);

-- Update policy exists for staff to mutate status, queue, etc.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'cases'
       AND policyname = 'cases_update_staff'
  ),
  'cases_update_staff policy exists'
);

-- Required indexes for the analyst dashboard / case-queue queries.
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'cases_assigned_to_idx'),
  'cases_assigned_to_idx exists'
);

SELECT * FROM finish();
ROLLBACK;
