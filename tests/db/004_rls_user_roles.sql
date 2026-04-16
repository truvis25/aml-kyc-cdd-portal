-- pgTAP test: user_roles append-only enforcement
-- Run with: supabase test db

BEGIN;
SELECT plan(3);

-- Test 1: authenticated has INSERT on user_roles
SELECT has_table_privilege(
  'authenticated',
  'user_roles',
  'INSERT',
  'authenticated role has INSERT privilege on user_roles'
);

-- Test 2: No UPDATE on user_roles — append-only
SELECT ok(
  NOT has_table_privilege('authenticated', 'user_roles', 'UPDATE'),
  'authenticated role does NOT have UPDATE on user_roles (append-only)'
);

-- Test 3: No DELETE on user_roles — append-only
SELECT ok(
  NOT has_table_privilege('authenticated', 'user_roles', 'DELETE'),
  'authenticated role does NOT have DELETE on user_roles (append-only)'
);

SELECT * FROM finish();
ROLLBACK;
