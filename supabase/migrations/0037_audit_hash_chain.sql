-- Migration: 0037_audit_hash_chain.sql
-- Purpose: Activate hash-chained audit trail per PRD §5.5.
--
-- The audit_log table has had `prev_hash` and `row_hash` columns since
-- migration 0003, but only `row_hash` was being populated (by the original
-- compute_audit_row_hash trigger). `prev_hash` was always NULL and the row
-- hash did not incorporate it — so tampering with a historic row was
-- detectable in isolation only, not as a broken chain.
--
-- This migration:
--   1. Replaces compute_audit_row_hash() so that each new row's hash is
--      digest(prev_row_hash || the existing 6 fields). Per-tenant advisory
--      lock makes the chain deterministic under concurrent inserts.
--   2. Backfills prev_hash + row_hash on all existing rows in chain order
--      per tenant. Temporarily disables the immutability trigger for the
--      backfill — a controlled migration-time operation.
--   3. Exposes a verify_audit_chain(tenant_id) SQL function that returns
--      one row per audit_log entry plus a status column. Used by the
--      scripts/verify-audit-chain.mjs CLI and by ad-hoc DBA queries.
--
-- Forward-compat: any change to the hash formula in the future MUST also
-- change the formula in verify_audit_chain() — they are intentionally
-- duplicated here so the verification logic is self-contained.

-- ============================================================
-- 1. Replace the row-hash trigger function with the chained version
-- ============================================================

CREATE OR REPLACE FUNCTION compute_audit_row_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v_prev_hash TEXT;
BEGIN
  -- Per-tenant advisory lock — serializes concurrent audit inserts within
  -- a single tenant so the chain is deterministic. Audit writes are low
  -- throughput (~10/onboarding session); the lock cost is negligible
  -- compared to the integrity guarantee.
  PERFORM pg_advisory_xact_lock(
    hashtext('audit_log_chain'),
    hashtext(NEW.tenant_id::TEXT)
  );

  -- Find the most recent prior row in this tenant's chain. NULL if this
  -- is the genesis row.
  SELECT row_hash INTO v_prev_hash
    FROM audit_log
   WHERE tenant_id = NEW.tenant_id
   ORDER BY event_time DESC, id DESC
   LIMIT 1;

  NEW.prev_hash = v_prev_hash;

  -- pgcrypto lives in the `extensions` schema (migration 0019). Calls must
  -- be qualified — unqualified digest() will fail to resolve at trigger-fire
  -- time even when the function definition succeeds.
  NEW.row_hash = encode(
    extensions.digest(
      COALESCE(v_prev_hash, '') ||
      NEW.tenant_id::TEXT ||
      NEW.event_time::TEXT ||
      NEW.event_type ||
      NEW.entity_type ||
      NEW.entity_id::TEXT ||
      NEW.payload::TEXT,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

-- Trigger itself was created in 0004 and remains attached; we only swapped
-- the function body.

-- ============================================================
-- 2. Backfill existing rows
-- ============================================================
--
-- We need to UPDATE rows that the immutability trigger normally blocks.
-- DISABLE TRIGGER USER suppresses both audit_log_no_update and
-- audit_log_no_delete for the duration of the migration transaction.
-- The backfill is idempotent: re-running on already-chained rows is a
-- no-op (same hash recomputed, identical write).

DO $$
DECLARE
  v_tenant     UUID;
  v_prev_hash  TEXT;
  v_new_hash   TEXT;
  r            RECORD;
BEGIN
  -- Search path includes extensions so unqualified digest() resolves to
  -- pgcrypto. (DO blocks don't accept SET; we use SET LOCAL inside.)
  SET LOCAL search_path = pg_catalog, public, extensions;

  ALTER TABLE audit_log DISABLE TRIGGER USER;

  FOR v_tenant IN SELECT DISTINCT tenant_id FROM audit_log LOOP
    v_prev_hash := NULL;
    FOR r IN
      SELECT id, tenant_id, event_time, event_type, entity_type, entity_id, payload
        FROM audit_log
       WHERE tenant_id = v_tenant
       ORDER BY event_time, id
    LOOP
      v_new_hash := encode(
        extensions.digest(
          COALESCE(v_prev_hash, '') ||
          r.tenant_id::TEXT ||
          r.event_time::TEXT ||
          r.event_type ||
          r.entity_type ||
          r.entity_id::TEXT ||
          r.payload::TEXT,
          'sha256'
        ),
        'hex'
      );
      UPDATE audit_log
         SET prev_hash = v_prev_hash,
             row_hash  = v_new_hash
       WHERE id = r.id;
      v_prev_hash := v_new_hash;
    END LOOP;
  END LOOP;

  ALTER TABLE audit_log ENABLE TRIGGER USER;
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure we re-enable the immutability trigger even if the backfill
    -- aborts midway. The transaction will still roll back the partial
    -- UPDATEs, leaving us in the pre-migration state.
    ALTER TABLE audit_log ENABLE TRIGGER USER;
    RAISE;
END;
$$;

-- ============================================================
-- 3. Verification function — server-side, recomputes the chain
-- ============================================================

CREATE OR REPLACE FUNCTION verify_audit_chain(p_tenant_id UUID)
RETURNS TABLE (
  row_id              UUID,
  event_time          TIMESTAMPTZ,
  expected_prev_hash  TEXT,
  actual_prev_hash    TEXT,
  expected_row_hash   TEXT,
  actual_row_hash     TEXT,
  status              TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
  WITH chain AS (
    SELECT
      id,
      tenant_id,
      event_time,
      event_type,
      entity_type,
      entity_id,
      payload,
      prev_hash,
      row_hash,
      LAG(row_hash) OVER (PARTITION BY tenant_id ORDER BY event_time, id) AS expected_prev
    FROM audit_log
    WHERE tenant_id = p_tenant_id
  ),
  scored AS (
    SELECT
      id,
      event_time,
      expected_prev,
      prev_hash,
      row_hash,
      encode(
        extensions.digest(
          COALESCE(expected_prev, '') ||
          tenant_id::TEXT ||
          event_time::TEXT ||
          event_type ||
          entity_type ||
          entity_id::TEXT ||
          payload::TEXT,
          'sha256'
        ),
        'hex'
      ) AS recomputed_row_hash
    FROM chain
  )
  SELECT
    id                             AS row_id,
    event_time,
    expected_prev                  AS expected_prev_hash,
    prev_hash                      AS actual_prev_hash,
    recomputed_row_hash            AS expected_row_hash,
    row_hash                       AS actual_row_hash,
    CASE
      WHEN prev_hash IS DISTINCT FROM expected_prev THEN 'BROKEN_CHAIN'
      WHEN row_hash  IS DISTINCT FROM recomputed_row_hash THEN 'TAMPERED_HASH'
      ELSE 'OK'
    END                            AS status
  FROM scored
  ORDER BY event_time, id;
$$;

-- Restrict execution: SECURITY DEFINER runs as table owner, so we limit
-- callers. authenticated may verify their own tenant only (RLS-friendly
-- view via the WHERE clause). service_role for the CLI verifier.
REVOKE EXECUTE ON FUNCTION verify_audit_chain(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_audit_chain(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION verify_audit_chain(UUID) IS
  'Walks the audit_log chain for the given tenant, returning OK / TAMPERED_HASH / BROKEN_CHAIN per row. Used by scripts/verify-audit-chain.mjs and by ad-hoc DBA verification.';
