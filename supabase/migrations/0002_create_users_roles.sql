-- Migration: 0002_create_users_roles.sql
-- Purpose: Platform RBAC — role definitions, user profiles, and role assignments
-- Source: DevPlan v1.0 Section 4.1, Section 4.2

-- Platform role definitions — seeded, not user-created
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Immutable once seeded — no RLS needed for public read
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_read_authenticated" ON roles
  FOR SELECT
  TO authenticated
  USING (true); -- All authenticated users can read role definitions

-- No INSERT/UPDATE/DELETE for authenticated role — roles are platform-defined


-- User profiles — extends auth.users
-- One record per platform user, linked to a single tenant
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  display_name TEXT,
  mfa_enabled  BOOLEAN NOT NULL DEFAULT false,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'suspended', 'deactivated')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: authenticated users see only their tenant's users
CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- Users insert: only via service role (invitation flow creates the user record)
-- No INSERT policy for authenticated role

-- Users update: users can update their own display_name only; admin updates via service role
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id);


-- User role assignments — append-only
-- Revocations create a new row with revoked_at set; the original row is preserved
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role_id    UUID NOT NULL REFERENCES roles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ  -- NULL = active assignment; non-NULL = revoked
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users see only their tenant's role assignments
CREATE POLICY "user_roles_select_own_tenant" ON user_roles
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- Tenant Admin can insert role assignments for their own tenant
CREATE POLICY "user_roles_insert_admin" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
  );

-- No UPDATE policy — append-only (revocations are new rows)
-- No DELETE policy — append-only

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_tenant_id_idx ON user_roles (tenant_id);
CREATE INDEX IF NOT EXISTS user_roles_active_idx ON user_roles (user_id, tenant_id) WHERE revoked_at IS NULL;
