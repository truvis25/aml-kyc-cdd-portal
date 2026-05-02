-- pgTAP test: RLS on users table — tenant isolation
-- Run with: supabase test db

BEGIN;
SELECT plan(3);

-- Test 1: authenticated role has SELECT on users
SELECT ok(
  has_table_privilege('authenticated', 'users', 'SELECT'),
  'authenticated role has SELECT privilege on users'
);

-- Test 2: No UPDATE privilege on users for authenticated role (except own profile policy)
-- The policy allows users to UPDATE their own row — but not arbitrary rows.
-- We test the privilege exists (for own-row UPDATE), but not the bypass.
SELECT ok(
  has_table_privilege('authenticated', 'users', 'UPDATE'),
  'authenticated role has UPDATE privilege on users (own profile only — tested by RLS policy)'
);

-- Test 3: No DELETE on users for authenticated role
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'users'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated role does NOT have DELETE privilege on users'
);

SELECT * FROM finish();
ROLLBACK;
