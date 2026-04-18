-- supabase/seed.sql
-- Local development seed data.
-- Run automatically by: supabase db reset
--   (after all migrations are applied)
--
-- DO NOT apply manually to staging or production.
-- Production bootstrap uses provision_admin_user() from migration 0006.
--
-- Section order is required:
--   1. Roles     — platform role definitions (idempotent; also in migration 0018)
--   2. Tenant    — test tenant for local dev
--   3. Admin user — test tenant_admin user + role assignment
--
-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Platform role definitions
-- Source: supabase/seed/01_roles.sql
-- NOTE: These rows are also inserted by migration 0018_seed_roles.sql, making
--       them available in all environments. The INSERT here is idempotent and
--       ensures the rows are present even if migration 0018 has not yet been
--       applied to a local instance being reset from scratch.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO roles (name, description) VALUES
  ('platform_super_admin', 'Cross-tenant platform operator. Read-only access to tenant config. Cannot read customer PII. Cannot make compliance decisions.'),
  ('tenant_admin',         'Single-tenant administrator. Manages users and workflow configuration. Cannot make MLRO-level compliance decisions.'),
  ('mlro',                 'MLRO / Compliance Officer. Full case access including EDD and SAR. Highest data access. All actions logged at field level.'),
  ('senior_reviewer',      'Senior Reviewer. Assigned case review. EDD case review. Cannot see SAR case status.'),
  ('analyst',              'Analyst (Reviewer). Assigned cases only. Cannot approve high-risk cases without second reviewer.'),
  ('onboarding_agent',     'Onboarding Agent. Initiates and assists with onboarding. Cannot see EDD data. Cannot make compliance decisions.'),
  ('read_only',            'Read-Only / Reporting. Aggregate and anonymised reports only. No individual customer PII. No case detail access.')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Test tenant
-- Source: supabase/seed/02_test-tenant.sql
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO tenants (id, slug, name, status, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'truvis-test',
  'TruVis Test Tenant',
  'active',
  '{
    "active_modules": ["m01", "m02", "m07", "m08", "m09", "m10", "m11", "m12", "m13"],
    "primary_jurisdiction": "UAE",
    "branding": {
      "company_name": "TruVis Test",
      "primary_color": "#1a56db"
    }
  }'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Test admin user
-- Source: supabase/seed/03_admin-user.sql
--
-- Login credentials (local dev only):
--   Email:    admin@truvis-test.local
--   Password: AdminPass123!
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id   uuid := '00000000-0000-0000-0000-000000000002';
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  v_role_id   uuid;
BEGIN

  -- 1. Auth user record (Supabase auth schema)
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
    -- LOCAL DEV ONLY — never use this credential in staging or production
    crypt('AdminPass123!', gen_salt('bf', 10)),
    NOW(),
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

  -- 2. App-level user profile (public.users)
  INSERT INTO users (id, tenant_id, display_name, mfa_enabled, status)
  VALUES (v_user_id, v_tenant_id, 'Test Admin', false, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Role assignment (tenant_admin)
  SELECT id INTO v_role_id FROM roles WHERE name = 'tenant_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'tenant_admin role not found -- migration 0018_seed_roles must run before seed';
  END IF;

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
