-- pgTAP test: user_roles append-only enforcement
-- Run with: supabase test db

BEGIN;
SELECT plan(3);

-- Test 1: authenticated has INSERT on user_roles
SELECT ok(
  has_table_privilege('authenticated', 'user_roles', 'INSERT'),
  'authenticated role has INSERT privilege on user_roles'
);

-- Test 2: No UPDATE on user_roles — append-only
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'user_roles'
       AND cmd IN ('UPDATE', 'ALL')
  ),
  'authenticated role does NOT have UPDATE on user_roles (append-only)'
);

-- Test 3: No DELETE on user_roles — append-only
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'user_roles'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated role does NOT have DELETE on user_roles (append-only)'
);

SELECT * FROM finish();
ROLLBACK;
