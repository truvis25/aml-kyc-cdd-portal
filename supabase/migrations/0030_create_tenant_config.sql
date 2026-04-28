-- Migration: 0030_create_tenant_config.sql
-- Purpose: Versioned tenant configuration. Replaces ad-hoc writes to
--          `tenants.settings` JSONB with an append-only versioned table so
--          every config change is auditable and the previous configuration
--          can be reconstructed.
-- Source: Sprint B — ROLES_DASHBOARDS_FLOWS.md §11 ("Tenant config versioning")

CREATE TABLE IF NOT EXISTS tenant_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  version      INTEGER NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  -- Optional human-readable note explaining why the change was made.
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, version)
);

ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tenant_config_tenant_id_idx
  ON tenant_config (tenant_id, version DESC);

-- Append-only guard: each config change is a new row. No UPDATE / DELETE.
CREATE OR REPLACE FUNCTION prevent_tenant_config_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'tenant_config is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_tenant_config_update
  BEFORE UPDATE ON tenant_config
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_config_modification();

CREATE TRIGGER no_tenant_config_delete
  BEFORE DELETE ON tenant_config
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_config_modification();

-- RLS: read scoped to tenant; write restricted to tenant_admin /
-- platform_super_admin. App layer additionally requires
-- `admin:manage_config` permission.
CREATE POLICY "tenant_config_select_staff" ON tenant_config
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "tenant_config_insert_admin" ON tenant_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
  );

-- Convenience view: latest config per tenant. Tenant-scoped via the
-- underlying RLS on `tenant_config`.
CREATE OR REPLACE VIEW tenant_config_latest AS
SELECT DISTINCT ON (tenant_id)
  tenant_id,
  id          AS config_id,
  version,
  config,
  notes,
  created_by,
  created_at
FROM tenant_config
ORDER BY tenant_id, version DESC;

COMMENT ON VIEW tenant_config_latest IS
  'Returns the most recent tenant_config row per tenant. RLS on the underlying table scopes access.';
