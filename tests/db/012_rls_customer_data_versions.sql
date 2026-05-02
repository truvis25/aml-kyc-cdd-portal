-- pgTAP test: customers + customer_data_versions
-- Source: migration 0007

BEGIN;
SELECT plan(4);

SELECT ok(
  has_table_privilege('authenticated', 'customers', 'SELECT'),
  'authenticated has SELECT on customers'
);

SELECT ok(
  has_table_privilege('authenticated', 'customer_data_versions', 'INSERT'),
  'authenticated has INSERT on customer_data_versions (versioned writes)'
);

-- customer_data_versions is append-only — no UPDATE/DELETE for authenticated.
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'customer_data_versions'
       AND cmd IN ('UPDATE', 'ALL')
  ),
  'authenticated does NOT have UPDATE on customer_data_versions'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'customer_data_versions'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on customer_data_versions'
);

SELECT * FROM finish();
ROLLBACK;
