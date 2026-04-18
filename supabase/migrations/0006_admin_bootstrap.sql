-- Migration: 0006_admin_bootstrap.sql
-- Purpose: Provide a safe, one-time helper to provision an existing Supabase Auth user
--          as the first tenant_admin when no invitation flow has run yet.
--
-- Usage (run from Supabase SQL Editor or via service role):
--
--   SELECT provision_admin_user(
--     'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',   -- auth.users.id of the target user
--     '00000000-0000-0000-0000-000000000001',   -- tenants.id to assign them to
--     'Display Name'                             -- optional display name
--   );
--
-- Returns: { "success": true, "message": "..." }
--      or: { "success": false, "error": "..." }
--
-- This function is SECURITY DEFINER so it can write to users/user_roles even when
-- called by a role that would normally be blocked by RLS.
-- Access is granted only to service_role; authenticated users cannot call it.
--
-- Source: DevPlan v1.0 Section 3.2 — Tenant Bootstrap

CREATE OR REPLACE FUNCTION provision_admin_user(
  p_auth_user_id uuid,
  p_tenant_id    uuid,
  p_display_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Validate: auth user must exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_auth_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auth user not found');
  END IF;

  -- Validate: tenant must exist and be active
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant not found or not active');
  END IF;

  -- Validate: roles seed must have run
  SELECT id INTO v_role_id FROM roles WHERE name = 'tenant_admin';
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      'tenant_admin role not found — run roles seed first');
  END IF;

  -- Upsert user profile (idempotent — safe to re-run)
  INSERT INTO users (id, tenant_id, display_name, mfa_enabled, status)
  VALUES (p_auth_user_id, p_tenant_id, p_display_name, false, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Assign tenant_admin only if no active role exists already
  IF EXISTS (
    SELECT 1 FROM user_roles
     WHERE user_id = p_auth_user_id
       AND tenant_id = p_tenant_id
       AND revoked_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', true,
      'message', 'User already has an active role — no changes made');
  END IF;

  INSERT INTO user_roles (user_id, tenant_id, role_id, granted_by)
  VALUES (p_auth_user_id, p_tenant_id, v_role_id, NULL);

  RETURN jsonb_build_object('success', true,
    'message', 'User provisioned as tenant_admin — they can now sign in');

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('success', false,
      'error', format('Unexpected error: %s', SQLERRM));
END;
$$;

-- Only service_role may call this; authenticated users cannot elevate themselves
REVOKE EXECUTE ON FUNCTION provision_admin_user(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION provision_admin_user(uuid, uuid, text) TO service_role;
