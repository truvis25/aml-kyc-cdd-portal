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

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Test users for non-MFA roles (E2E + local dev)
--
-- Source of truth for the IDs / emails: tests/e2e/helpers/seed-config.ts
-- — keep them in sync if you ever rotate one.
--
-- Why only 4 of 7 roles: MFA_REQUIRED_ROLES in proxy.ts mandates aal=aal2
-- for tenant_admin / mlro / platform_super_admin. Bypassing that in the
-- proxy for tests would be a backdoor; enrolling a TOTP factor at seed
-- time via the auth schema is fragile and Supabase-version-specific.
-- These four roles (analyst, senior_reviewer, onboarding_agent, read_only)
-- have MFA optional / not required and can sign in directly.
--
-- Login credentials (LOCAL DEV ONLY):
--   analyst@truvis-test.local       TestPass123!
--   sr@truvis-test.local            TestPass123!
--   agent@truvis-test.local         TestPass123!
--   readonly@truvis-test.local      TestPass123!
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  v_password  text := 'TestPass123!';
  v_role_id   uuid;
  v_user      record;
BEGIN
  FOR v_user IN
    SELECT * FROM (VALUES
      ('e0000000-0000-0000-0000-000000000001'::uuid, 'analyst@truvis-test.local',  'Test Analyst',          'analyst'),
      ('e0000000-0000-0000-0000-000000000002'::uuid, 'sr@truvis-test.local',       'Test Senior Reviewer',  'senior_reviewer'),
      ('e0000000-0000-0000-0000-000000000003'::uuid, 'agent@truvis-test.local',    'Test Onboarding Agent', 'onboarding_agent'),
      ('e0000000-0000-0000-0000-000000000004'::uuid, 'readonly@truvis-test.local', 'Test Read Only',        'read_only')
    ) AS t(user_id, email, display_name, role_name)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user.user_id,
      'authenticated',
      'authenticated',
      v_user.email,
      crypt(v_password, gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', v_user.display_name),
      false,
      NOW(),
      NOW(),
      '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO users (id, tenant_id, display_name, mfa_enabled, status)
    VALUES (v_user.user_id, v_tenant_id, v_user.display_name, false, 'active')
    ON CONFLICT (id) DO NOTHING;

    SELECT id INTO v_role_id FROM roles WHERE name = v_user.role_name;
    IF v_role_id IS NULL THEN
      RAISE EXCEPTION '% role not found — migration 0018_seed_roles must run before seed', v_user.role_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM user_roles
       WHERE user_id = v_user.user_id
         AND tenant_id = v_tenant_id
         AND revoked_at IS NULL
    ) THEN
      INSERT INTO user_roles (user_id, tenant_id, role_id, granted_by)
      VALUES (v_user.user_id, v_tenant_id, v_role_id, NULL);
    END IF;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Fixture customers, risk assessments, cases
--
-- Two customers + matching cases drive the gated `app` Playwright project.
-- All IDs match tests/e2e/helpers/seed-config.ts.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_tenant_id   uuid := '00000000-0000-0000-0000-000000000001';
  v_analyst_id  uuid := 'e0000000-0000-0000-0000-000000000001';
  v_sr_id       uuid := 'e0000000-0000-0000-0000-000000000002';

  v_cust_med    uuid := 'c0000000-0000-0000-0000-000000000001';
  v_cust_high   uuid := 'c0000000-0000-0000-0000-000000000002';

  v_risk_med    uuid := 'a0000000-0000-0000-0000-000000000010';
  v_risk_high   uuid := 'a0000000-0000-0000-0000-000000000011';

  v_case_med    uuid := 'ca000000-0000-0000-0000-000000000001';
  v_case_high   uuid := 'ca000000-0000-0000-0000-000000000002';
BEGIN
  -- Customers (two individuals, both UAE nationals)
  INSERT INTO customers (id, tenant_id, customer_type, status, latest_version)
  VALUES
    (v_cust_med,  v_tenant_id, 'individual', 'in_progress', 1),
    (v_cust_high, v_tenant_id, 'individual', 'in_progress', 1)
  ON CONFLICT (id) DO NOTHING;

  -- Latest customer_data_versions (v1 each) — minimum fields for the workbench
  INSERT INTO customer_data_versions (
    customer_id, tenant_id, version, full_name, date_of_birth, nationality,
    country_of_residence, id_type, id_number, emirates_id_number,
    occupation, source_of_funds, purpose_of_relationship, pep_status
  ) VALUES
    (v_cust_med,  v_tenant_id, 1, 'Aisha Test Subject', '1990-04-12', 'AE', 'AE', 'national_id',
     '784199012345676', '784-1990-1234567-6', 'Software Engineer', 'Salary', 'Personal account', false),
    (v_cust_high, v_tenant_id, 1, 'Hamad Test Subject', '1985-09-30', 'AE', 'AE', 'national_id',
     '784198598765430', '784-1985-9876543-0', 'Property Investor', 'Real estate', 'Investment account', true)
  ON CONFLICT (customer_id, version) DO NOTHING;

  -- Risk assessments: medium and high (matches the queues below)
  INSERT INTO risk_assessments (id, tenant_id, customer_id, composite_score, risk_band,
                                customer_score, geographic_score, product_score, factor_breakdown)
  VALUES
    (v_risk_med,  v_tenant_id, v_cust_med,  45.00, 'medium', 40.00, 30.00, 50.00, '{"source": "seed"}'::jsonb),
    (v_risk_high, v_tenant_id, v_cust_high, 72.00, 'high',   75.00, 60.00, 70.00, '{"source": "seed"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Cases — one assigned to the analyst (standard queue), one to the SR (edd queue)
  INSERT INTO cases (id, tenant_id, customer_id, risk_assessment_id, queue, status, assigned_to)
  VALUES
    (v_case_med,  v_tenant_id, v_cust_med,  v_risk_med,  'standard', 'in_review', v_analyst_id),
    (v_case_high, v_tenant_id, v_cust_high, v_risk_high, 'edd',      'in_review', v_sr_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;
