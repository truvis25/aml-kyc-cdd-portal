-- pgTAP test: customer_data_versions.emirates_id_number column
-- Source: migration 0039_add_emirates_id.sql
--
-- Pins the format CHECK constraint (regex 784-YYYY-NNNNNNN-N) and the
-- partial index. Conditional-required-by-nationality is enforced at the
-- API layer (Zod) and is not testable in pgTAP without a tenant + user
-- context.

BEGIN;
SELECT plan(7);

SELECT has_column('public', 'customer_data_versions', 'emirates_id_number',
  'customer_data_versions has emirates_id_number column');

SELECT col_type_is('public', 'customer_data_versions', 'emirates_id_number', 'text',
  'emirates_id_number is text');

SELECT col_is_null('public', 'customer_data_versions', 'emirates_id_number',
  'emirates_id_number is nullable (UAE-specific, not all customers have one)');

-- The format CHECK accepts canonical input.
DO $$
DECLARE v_tenant UUID; v_customer UUID;
BEGIN
  SELECT id INTO v_tenant FROM tenants LIMIT 1;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Test setup: no tenants present.';
  END IF;
  INSERT INTO customers (tenant_id, customer_type, status, latest_version)
    VALUES (v_tenant, 'individual', 'pending', 0)
    RETURNING id INTO v_customer;
  PERFORM set_config('test.tenant_id', v_tenant::TEXT, true);
  PERFORM set_config('test.customer_id', v_customer::TEXT, true);
END $$;

SELECT lives_ok(
  $$
    INSERT INTO customer_data_versions (tenant_id, customer_id, version, emirates_id_number)
    VALUES (
      current_setting('test.tenant_id')::UUID,
      current_setting('test.customer_id')::UUID,
      1,
      '784-1990-1234567-6'
    )
  $$,
  'INSERT with canonical Emirates ID succeeds'
);

-- The CHECK rejects malformed input.
SELECT throws_ok(
  $$
    INSERT INTO customer_data_versions (tenant_id, customer_id, version, emirates_id_number)
    VALUES (
      current_setting('test.tenant_id')::UUID,
      current_setting('test.customer_id')::UUID,
      2,
      '784199012345676'
    )
  $$,
  '23514',
  NULL,
  'INSERT with un-dashed digits rejected by format CHECK'
);

SELECT throws_ok(
  $$
    INSERT INTO customer_data_versions (tenant_id, customer_id, version, emirates_id_number)
    VALUES (
      current_setting('test.tenant_id')::UUID,
      current_setting('test.customer_id')::UUID,
      3,
      '123-1990-1234567-6'
    )
  $$,
  '23514',
  NULL,
  'INSERT with non-784 prefix rejected by format CHECK'
);

-- Partial index for hot lookup
SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'customer_data_versions_emirates_id_idx'),
  'customer_data_versions_emirates_id_idx exists for EID lookups'
);

SELECT * FROM finish();
ROLLBACK;
