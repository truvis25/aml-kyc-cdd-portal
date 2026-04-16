-- pgTAP test: audit_log immutability
-- Run with: supabase test db
-- Source: DevPlan v1.0 Section 8.4 — Audit immutability requirement

BEGIN;
SELECT plan(5);

-- Test 1: INSERT succeeds on audit_log
SELECT lives_ok(
  $$
    INSERT INTO audit_log (tenant_id, event_type, entity_type, entity_id, payload)
    SELECT
      id,
      'test.insert',
      'tenants',
      id,
      '{"test": true}'::JSONB
    FROM tenants
    LIMIT 1
  $$,
  'INSERT into audit_log succeeds'
);

-- Test 2: row_hash is NOT NULL after insert
SELECT isnt(
  (SELECT row_hash FROM audit_log WHERE event_type = 'test.insert' LIMIT 1),
  NULL,
  'row_hash is populated after insert'
);

-- Test 3: row_hash is a 64-char hex string (SHA-256)
SELECT matches(
  (SELECT row_hash FROM audit_log WHERE event_type = 'test.insert' LIMIT 1),
  '^[0-9a-f]{64}$',
  'row_hash is a 64-character hex string (SHA-256)'
);

-- Test 4: UPDATE on audit_log raises exception
SELECT throws_ok(
  $$
    UPDATE audit_log SET event_type = 'tampered' WHERE event_type = 'test.insert'
  $$,
  'P0001',
  NULL,
  'UPDATE on audit_log raises exception (audit_log records are immutable)'
);

-- Test 5: DELETE on audit_log raises exception
SELECT throws_ok(
  $$
    DELETE FROM audit_log WHERE event_type = 'test.insert'
  $$,
  'P0001',
  NULL,
  'DELETE on audit_log raises exception (audit_log records are immutable)'
);

SELECT * FROM finish();
ROLLBACK;
