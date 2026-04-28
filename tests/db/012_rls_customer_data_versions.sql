-- pgTAP test: customers + customer_data_versions
-- Source: migration 0007

BEGIN;
SELECT plan(4);

SELECT has_table_privilege(
  'authenticated', 'customers', 'SELECT',
  'authenticated has SELECT on customers'
);

SELECT has_table_privilege(
  'authenticated', 'customer_data_versions', 'INSERT',
  'authenticated has INSERT on customer_data_versions (versioned writes)'
);

-- customer_data_versions is append-only — no UPDATE/DELETE for authenticated.
SELECT ok(
  NOT has_table_privilege('authenticated', 'customer_data_versions', 'UPDATE'),
  'authenticated does NOT have UPDATE on customer_data_versions'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'customer_data_versions', 'DELETE'),
  'authenticated does NOT have DELETE on customer_data_versions'
);

SELECT * FROM finish();
ROLLBACK;
