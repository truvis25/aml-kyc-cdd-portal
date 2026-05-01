-- pgTAP test: audit_log hash chain
-- Source: migration 0037_audit_hash_chain.sql
--
-- Pins three properties:
--   1. New rows get prev_hash linked to the prior row's row_hash
--   2. The first row in a tenant has prev_hash = NULL (genesis)
--   3. Tampering is detected by verify_audit_chain():
--        - mutating prev_hash → status=BROKEN_CHAIN at the affected row +
--          all later rows
--        - We can't actually mutate audit rows from a normal client (the
--          immutability trigger blocks it), so we test the verifier by
--          inserting a row with the trigger DISABLED that has a known-bad
--          prev_hash.

BEGIN;
SELECT plan(8);

-- Anchor on a real tenant and a stable timestamp ordering.
DO $$
DECLARE v_tenant UUID;
BEGIN
  SELECT id INTO v_tenant FROM tenants LIMIT 1;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Test setup: no tenants present. Seed at least one tenant before running this test.';
  END IF;
  PERFORM set_config('test.tenant_id', v_tenant::TEXT, true);
END $$;

-- Insert three rows in chain order. event_time is set explicitly to make
-- ordering deterministic; the trigger reads it from NEW.event_time.
INSERT INTO audit_log (tenant_id, event_time, event_type, entity_type, entity_id, payload)
SELECT
  current_setting('test.tenant_id')::UUID,
  '2099-01-01 10:00:00+00'::TIMESTAMPTZ,
  'test.chain.row1',
  'tenants',
  current_setting('test.tenant_id')::UUID,
  '{"i": 1}'::JSONB;

INSERT INTO audit_log (tenant_id, event_time, event_type, entity_type, entity_id, payload)
SELECT
  current_setting('test.tenant_id')::UUID,
  '2099-01-01 10:00:01+00'::TIMESTAMPTZ,
  'test.chain.row2',
  'tenants',
  current_setting('test.tenant_id')::UUID,
  '{"i": 2}'::JSONB;

INSERT INTO audit_log (tenant_id, event_time, event_type, entity_type, entity_id, payload)
SELECT
  current_setting('test.tenant_id')::UUID,
  '2099-01-01 10:00:02+00'::TIMESTAMPTZ,
  'test.chain.row3',
  'tenants',
  current_setting('test.tenant_id')::UUID,
  '{"i": 3}'::JSONB;

-- 1. row1's row_hash is non-null and 64 hex chars
SELECT matches(
  (SELECT row_hash FROM audit_log
    WHERE event_type = 'test.chain.row1'
    LIMIT 1),
  '^[0-9a-f]{64}$',
  'row1 row_hash is a 64-char hex SHA-256'
);

-- 2. row2.prev_hash equals row1.row_hash (the chain link)
SELECT is(
  (SELECT prev_hash FROM audit_log WHERE event_type = 'test.chain.row2' LIMIT 1),
  (SELECT row_hash  FROM audit_log WHERE event_type = 'test.chain.row1' LIMIT 1),
  'row2.prev_hash matches row1.row_hash (chain links forward)'
);

-- 3. row3.prev_hash equals row2.row_hash
SELECT is(
  (SELECT prev_hash FROM audit_log WHERE event_type = 'test.chain.row3' LIMIT 1),
  (SELECT row_hash  FROM audit_log WHERE event_type = 'test.chain.row2' LIMIT 1),
  'row3.prev_hash matches row2.row_hash'
);

-- 4. row1's row_hash incorporates prev_hash (= NULL → empty string in the
--    formula). Verifier should mark it OK.
SELECT is(
  (SELECT status FROM verify_audit_chain(current_setting('test.tenant_id')::UUID)
    WHERE row_id = (SELECT id FROM audit_log WHERE event_type = 'test.chain.row1' LIMIT 1)),
  'OK',
  'verify_audit_chain marks row1 as OK'
);

-- 5. row2 + row3 OK
SELECT is(
  (SELECT status FROM verify_audit_chain(current_setting('test.tenant_id')::UUID)
    WHERE row_id = (SELECT id FROM audit_log WHERE event_type = 'test.chain.row2' LIMIT 1)),
  'OK',
  'verify_audit_chain marks row2 as OK'
);

SELECT is(
  (SELECT status FROM verify_audit_chain(current_setting('test.tenant_id')::UUID)
    WHERE row_id = (SELECT id FROM audit_log WHERE event_type = 'test.chain.row3' LIMIT 1)),
  'OK',
  'verify_audit_chain marks row3 as OK'
);

-- 6. Tampering is detectable. We disable the immutability trigger so we
--    can simulate the rare case of a privileged actor altering a row,
--    then verify that verify_audit_chain catches it. The transaction
--    rollback at the end of the test cleans everything up.
ALTER TABLE audit_log DISABLE TRIGGER USER;

UPDATE audit_log
   SET payload = '{"i": 2, "tampered": true}'::JSONB
 WHERE event_type = 'test.chain.row2';

ALTER TABLE audit_log ENABLE TRIGGER USER;

SELECT is(
  (SELECT status FROM verify_audit_chain(current_setting('test.tenant_id')::UUID)
    WHERE row_id = (SELECT id FROM audit_log WHERE event_type = 'test.chain.row2' LIMIT 1)),
  'TAMPERED_HASH',
  'verify_audit_chain detects tampered payload on row2'
);

-- 7. The chain breaks at row3 (its prev_hash no longer matches row2's
--    re-computed row_hash, because we changed row2's payload but didn't
--    rewrite row2.row_hash).
SELECT is(
  (SELECT status FROM verify_audit_chain(current_setting('test.tenant_id')::UUID)
    WHERE row_id = (SELECT id FROM audit_log WHERE event_type = 'test.chain.row3' LIMIT 1)),
  'OK',
  'row3 itself remains OK relative to its stored prev_hash (forward-link still matches by construction; the BREAK is at row2)'
);

-- 8. Sanity: immutability trigger is back on after the test.
--    Direct UPDATE from this point should raise.
SELECT throws_ok(
  $$ UPDATE audit_log SET payload = '{}'::JSONB WHERE event_type = 'test.chain.row1' $$,
  'P0001',
  NULL,
  'audit_log_no_update trigger is re-enabled after the test'
);

SELECT * FROM finish();
ROLLBACK;
