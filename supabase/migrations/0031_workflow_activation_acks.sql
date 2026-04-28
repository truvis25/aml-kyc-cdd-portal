-- Migration: 0031_workflow_activation_acks.sql
-- Purpose: Server-enforced MLRO acknowledgement gate for workflow activation.
--          A workflow_definition cannot transition is_active = true without a
--          matching un-revoked ack from a user with role 'mlro' for that
--          workflow's id + version. Enforced via `assert_workflow_ack()` plus
--          a BEFORE UPDATE trigger on workflow_definitions.
-- Source: Sprint B — ROLES_DASHBOARDS_FLOWS.md §11 ("MLRO workflow acknowledgement, server-enforced")

CREATE TABLE IF NOT EXISTS workflow_activation_acks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id),
  workflow_version INTEGER NOT NULL,
  acknowledged_by UUID NOT NULL REFERENCES users(id),
  acknowledged_role TEXT NOT NULL,
  notes           TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Acks can be revoked (e.g. MLRO retracts approval). Activation gate looks
  -- only at rows with revoked_at IS NULL.
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID REFERENCES users(id),
  UNIQUE (workflow_id, workflow_version, acknowledged_by, revoked_at)
);

ALTER TABLE workflow_activation_acks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS workflow_acks_workflow_idx
  ON workflow_activation_acks (workflow_id, workflow_version)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS workflow_acks_tenant_idx
  ON workflow_activation_acks (tenant_id);

-- Append-effectively-only: UPDATE allowed solely to set revoked_at; DELETE blocked.
CREATE OR REPLACE FUNCTION prevent_workflow_ack_destructive()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'workflow_activation_acks: DELETE not permitted on row %', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_workflow_ack_delete
  BEFORE DELETE ON workflow_activation_acks
  FOR EACH ROW EXECUTE FUNCTION prevent_workflow_ack_destructive();

CREATE OR REPLACE FUNCTION restrict_workflow_ack_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only revoked_at / revoked_by may change, and only NULL → non-NULL.
  IF (OLD.id <> NEW.id
      OR OLD.tenant_id <> NEW.tenant_id
      OR OLD.workflow_id <> NEW.workflow_id
      OR OLD.workflow_version <> NEW.workflow_version
      OR OLD.acknowledged_by <> NEW.acknowledged_by
      OR OLD.acknowledged_role <> NEW.acknowledged_role
      OR OLD.acknowledged_at <> NEW.acknowledged_at
      OR COALESCE(OLD.notes, '') <> COALESCE(NEW.notes, '')) THEN
    RAISE EXCEPTION 'workflow_activation_acks is append-only except for revocation';
  END IF;
  IF OLD.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'workflow_activation_acks row % is already revoked', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restrict_workflow_ack_update
  BEFORE UPDATE ON workflow_activation_acks
  FOR EACH ROW EXECUTE FUNCTION restrict_workflow_ack_updates();

-- RLS: tenant-scoped read; insert by mlro / tenant_admin / platform_super_admin.
CREATE POLICY "workflow_acks_select_staff" ON workflow_activation_acks
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "workflow_acks_insert_mlro" ON workflow_activation_acks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
  );

CREATE POLICY "workflow_acks_revoke_mlro" ON workflow_activation_acks
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
  );


-- Activation gate: prevents `workflow_definitions.is_active` from transitioning
-- false → true without a current ack.
--
-- Exemption: platform-level workflows (tenant_id IS NULL) bypass the ack gate.
-- Their activation is controlled at the platform_super_admin layer where
-- there is no tenant MLRO to acknowledge.
CREATE OR REPLACE FUNCTION assert_workflow_ack()
RETURNS TRIGGER AS $$
DECLARE
  v_ack_count INT;
BEGIN
  IF NEW.is_active = true AND COALESCE(OLD.is_active, false) = false THEN
    -- Platform workflows: no ack required.
    IF NEW.tenant_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT count(*) INTO v_ack_count
      FROM workflow_activation_acks
     WHERE workflow_id = NEW.id
       AND workflow_version = NEW.version
       AND acknowledged_role = 'mlro'
       AND revoked_at IS NULL;

    IF v_ack_count = 0 THEN
      RAISE EXCEPTION
        'workflow_definitions.is_active cannot be set to true without an MLRO acknowledgement (workflow_id=%, version=%)',
        NEW.id, NEW.version
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_workflow_activation_ack
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION assert_workflow_ack();

-- Also fire on INSERT so a row that lands directly with is_active = true is
-- subject to the same gate.
CREATE TRIGGER enforce_workflow_activation_ack_insert
  BEFORE INSERT ON workflow_definitions
  FOR EACH ROW
  WHEN (NEW.is_active = true AND NEW.tenant_id IS NOT NULL)
  EXECUTE FUNCTION assert_workflow_ack();
