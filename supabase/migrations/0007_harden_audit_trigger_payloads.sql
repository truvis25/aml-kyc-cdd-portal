-- Migration: 0007_harden_audit_trigger_payloads.sql
-- Purpose:
--   1) Remove PII-rich row snapshots from trigger-generated audit payloads
--   2) Make audit trigger fail closed (do not swallow audit write failures)
--   3) Correct tenant resolution for tenants table trigger events

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_entity_id UUID;
BEGIN
  -- Tenants table uses id as the tenant identifier.
  IF TG_TABLE_NAME = 'tenants' THEN
    IF TG_OP = 'DELETE' THEN
      v_tenant_id := OLD.id;
      v_entity_id := OLD.id;
    ELSE
      v_tenant_id := NEW.id;
      v_entity_id := NEW.id;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_tenant_id := OLD.tenant_id;
      v_entity_id := OLD.id;
    ELSE
      v_tenant_id := NEW.tenant_id;
      v_entity_id := NEW.id;
    END IF;
  END IF;

  INSERT INTO audit_log (
    tenant_id,
    event_type,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    payload
  ) VALUES (
    v_tenant_id,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'role', 'system'),
    jsonb_build_object(
      'source', 'db_trigger',
      'operation', lower(TG_OP)
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
