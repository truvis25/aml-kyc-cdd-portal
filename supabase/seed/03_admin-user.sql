-- Seed: admin-user.sql
-- Creates a fully provisioned test admin user for local development.
-- Requires: roles.sql and test-tenant.sql to have run first.
-- DO NOT run in production.
--
-- Login credentials (local dev only):
--   Email:    admin@truvis-test.local
--   Password: AdminPass123!
--
-- The auth.users insert uses crypt() from the pgcrypto extension,
-- which is pre-installed in Supabase local dev.

DO $$
DECLARE
  v_user_id   uuid := '00000000-0000-0000-0000-000000000002';
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  v_role_id   uuid;
BEGIN

  -- ----------------------------------------------------------------
  -- 1. Auth user record (Supabase auth schema)
  -- ----------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'admin@truvis-test.local',
    crypt('AdminPass123!', gen_salt('bf', 10)),
    NOW(),  -- email already confirmed — skip confirmation flow
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Test Admin"}'::jsonb,
    false,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------
  -- 2. App-level user profile (public.users)
  -- ----------------------------------------------------------------
  INSERT INTO users (id, tenant_id, display_name, mfa_enabled, status)
  VALUES (v_user_id, v_tenant_id, 'Test Admin', false, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------
  -- 3. Role assignment (tenant_admin)
  -- ----------------------------------------------------------------
  SELECT id INTO v_role_id FROM roles WHERE name = 'tenant_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'tenant_admin role not found — ensure roles.sql seed ran first';
  END IF;

  -- Only insert if no active role exists (unique partial index enforces one active role)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
     WHERE user_id = v_user_id
       AND tenant_id = v_tenant_id
       AND revoked_at IS NULL
  ) THEN
    INSERT INTO user_roles (user_id, tenant_id, role_id, granted_by)
    VALUES (v_user_id, v_tenant_id, v_role_id, NULL);
  END IF;

END;
$$;
