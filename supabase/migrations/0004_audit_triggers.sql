-- Migration: 0004_audit_triggers.sql
-- Purpose: Enforce audit_log immutability + generic audit trigger for compliance tables
--
-- Source: DevPlan v1.0 Section 3.3, Section 8.4
-- PRD v1.0 Section 4.4
--
-- Two functions defined here:
-- 1. prevent_audit_modification() — blocks all UPDATE and DELETE on audit_log
-- 2. log_audit_event()            — generic trigger that writes to audit_log
--                                   on INSERT/UPDATE of compliance-critical tables


-- ============================================================
-- 1. AUDIT LOG IMMUTABILITY TRIGGER
-- ============================================================
-- Prevents UPDATE and DELETE on audit_log at the database level.
-- This is the secondary control after the permission grant omissions.

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'audit_log records are immutable. Table: %. Operation: %. Row ID: %.',
    TG_TABLE_NAME, TG_OP, OLD.id
    USING ERRCODE = 'insufficient_privilege';
  RETURN NULL;
END;
$$;

-- Attach to audit_log: fire BEFORE UPDATE
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- Attach to audit_log: fire BEFORE DELETE
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();


-- ============================================================
-- 2. ROW HASH COMPUTATION TRIGGER
-- ============================================================
-- Computes SHA-256 row_hash on INSERT to audit_log.
-- The hash covers the fields that must not be tampered with.

CREATE OR REPLACE FUNCTION compute_audit_row_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.row_hash = encode(
    digest(
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

CREATE TRIGGER audit_log_compute_hash
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_row_hash();


-- ============================================================
-- 3. GENERIC AUDIT TRIGGER FOR COMPLIANCE TABLES
-- ============================================================
-- Writes an audit event automatically when rows are inserted or updated
-- on compliance-critical tables. This is a defence-in-depth measure —
-- the application layer should ALSO explicitly call the audit service,
-- but this trigger catches any cases where the application forgets.
--
-- Used by: tenants, users, user_roles (attached below)
-- Will be attached to additional tables in later migrations as they are created.

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as table owner to bypass RLS for audit writes
AS $$
DECLARE
  v_tenant_id UUID;
  v_entity_id UUID;
BEGIN
  -- Determine tenant_id from the row (all compliance tables have tenant_id)
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD.tenant_id;
    v_entity_id := OLD.id;
  ELSE
    v_tenant_id := NEW.tenant_id;
    v_entity_id := NEW.id;
  END IF;

  -- Skip if tenant_id is null (shouldn't happen, but safety check)
  IF v_tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO audit_log (
    tenant_id,
    event_type,
    entity_type,
    entity_id,
    payload
  ) VALUES (
    v_tenant_id,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    CASE
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB
      ELSE row_to_json(NEW)::JSONB
    END
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but do not block the original operation
    -- The audit write failure will be visible in Postgres logs
    RAISE WARNING 'log_audit_event() failed for table % op %: %', TG_TABLE_NAME, TG_OP, SQLERRM;
    RETURN NEW;
END;
$$;

-- Attach generic audit trigger to tenants table
CREATE TRIGGER tenants_audit_log
  AFTER INSERT OR UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Attach generic audit trigger to users table
CREATE TRIGGER users_audit_log
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Attach generic audit trigger to user_roles table
-- Note: user_roles is append-only — UPDATE trigger fires only if someone tries to update (shouldn't happen)
CREATE TRIGGER user_roles_audit_log
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();
