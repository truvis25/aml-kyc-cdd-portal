-- Migration: 0005_jwt_custom_access_token_hook.sql
-- Purpose: Postgres Custom Access Token Hook for JWT enrichment
--
-- Decision C-02 (confirmed): JWT enrichment uses a Postgres Function
-- Custom Access Token Hook, NOT an HTTP/Edge Function hook.
--
-- How it works:
--   Supabase calls this function on every token issuance/refresh.
--   The function enriches the JWT claims with tenant_id, role,
--   mfa_verified, and permissions[].
--   These claims are consumed by:
--     - RLS policies:   auth.jwt() ->> 'tenant_id'
--     - proxy.ts:       JWT claim inspection (no DB round-trip)
--     - API routes:     auth context assertions
--
-- Registration:
--   After applying this migration, register the function in:
--   Supabase Dashboard → Authentication → Hooks
--   → Custom Access Token Hook → select function: custom_access_token_hook
--
-- Source: DevPlan v1.0 Section 4.1 (JWT Custom Claims)
--         Confirmed decision C-02 (2026-04-16)

-- ============================================================
-- Permission map — mirrors modules/auth/rbac.ts exactly.
-- MUST be kept in sync if permissions change.
-- ============================================================

CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_tenant_id     uuid;
  v_role_name     text;
  v_mfa_enabled   boolean;
  v_permissions   text[];
  claims          jsonb;
BEGIN
  v_user_id := (event ->> 'user_id')::uuid;

  -- ----------------------------------------------------------------
  -- 1. Resolve active role assignment for this user
  --    SECURITY DEFINER bypasses RLS so we can always read user_roles.
  -- ----------------------------------------------------------------
  SELECT ur.tenant_id, r.name
    INTO v_tenant_id, v_role_name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
   WHERE ur.user_id = v_user_id
     AND ur.revoked_at IS NULL
   ORDER BY ur.granted_at DESC
   LIMIT 1;

  -- Fail closed: no active role → return event unchanged.
  -- proxy.ts detects missing tenant_id/role and blocks access.
  IF v_tenant_id IS NULL THEN
    RETURN event;
  END IF;

  -- ----------------------------------------------------------------
  -- 2. MFA status
  -- ----------------------------------------------------------------
  SELECT mfa_enabled
    INTO v_mfa_enabled
    FROM users
   WHERE id = v_user_id;

  v_mfa_enabled := COALESCE(v_mfa_enabled, false);

  -- ----------------------------------------------------------------
  -- 3. Permission array per role
  -- ----------------------------------------------------------------
  v_permissions := CASE v_role_name
    WHEN 'platform_super_admin' THEN ARRAY[
      'admin:view_all_tenants',
      'admin:manage_config',
      'audit:read',
      'audit:export'
    ]
    WHEN 'tenant_admin' THEN ARRAY[
      'admin:manage_users',
      'admin:manage_config',
      'admin:activate_workflow',
      'cases:read_all',
      'customers:read_all',
      'documents:read',
      'screening:read',
      'risk:read',
      'audit:read',
      'audit:export',
      'reporting:read_aggregate'
    ]
    WHEN 'mlro' THEN ARRAY[
      'cases:read_all',
      'cases:read_high_risk',
      'cases:add_note',
      'cases:request_additional_info',
      'cases:escalate',
      'cases:approve_standard',
      'cases:approve_high_risk',
      'cases:reject',
      'cases:view_sar_status',
      'customers:read_all',
      'customers:read_edd_data',
      'documents:read',
      'screening:read',
      'screening:resolve_hit',
      'risk:read',
      'risk:configure',
      'audit:read',
      'audit:export',
      'reporting:read_aggregate'
    ]
    WHEN 'senior_reviewer' THEN ARRAY[
      'cases:read_assigned',
      'cases:add_note',
      'cases:request_additional_info',
      'cases:escalate',
      'cases:approve_standard',
      'cases:approve_high_risk',
      'cases:reject',
      'customers:read_assigned',
      'customers:read_edd_data',
      'documents:read',
      'screening:read',
      'screening:resolve_hit',
      'risk:read',
      'reporting:read_aggregate'
    ]
    WHEN 'analyst' THEN ARRAY[
      'cases:read_assigned',
      'cases:add_note',
      'cases:request_additional_info',
      'cases:escalate',
      'cases:approve_standard',
      'cases:reject',
      'customers:read_assigned',
      'documents:read',
      'screening:read',
      'screening:resolve_hit',
      'risk:read'
    ]
    WHEN 'onboarding_agent' THEN ARRAY[
      'onboarding:initiate',
      'onboarding:assist_customer',
      'documents:upload'
    ]
    WHEN 'read_only' THEN ARRAY[
      'reporting:read_aggregate'
    ]
    ELSE ARRAY[]::text[]
  END;

  -- ----------------------------------------------------------------
  -- 4. Merge custom claims into the JWT event
  -- ----------------------------------------------------------------
  claims := event -> 'claims';
  claims := jsonb_set(claims, '{tenant_id}',   to_jsonb(v_tenant_id));
  claims := jsonb_set(claims, '{role}',         to_jsonb(v_role_name));
  claims := jsonb_set(claims, '{mfa_verified}', to_jsonb(v_mfa_enabled));
  claims := jsonb_set(claims, '{permissions}',  to_jsonb(v_permissions));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;

EXCEPTION
  WHEN others THEN
    -- Fail closed on unexpected error: return event unchanged.
    -- Supabase will issue the token without custom claims; proxy.ts
    -- will detect missing tenant_id/role and block access.
    RAISE WARNING 'custom_access_token_hook error for user %: %', v_user_id, SQLERRM;
    RETURN event;
END;
$$;

-- ----------------------------------------------------------------
-- Grant/revoke as required by Supabase Auth Hook documentation.
-- supabase_auth_admin must be able to call the function.
-- public must NOT be able to call it directly.
-- ----------------------------------------------------------------
GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook FROM PUBLIC;

-- ----------------------------------------------------------------
-- Enforce at most one active role assignment per user+tenant.
-- Without this constraint, the LIMIT 1 ORDER BY granted_at DESC
-- in the hook would yield non-deterministic role selection.
-- Revoked rows (revoked_at IS NOT NULL) are excluded so the
-- history is preserved (append-only convention).
-- ----------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_active_per_user_tenant
  ON user_roles (user_id, tenant_id)
  WHERE revoked_at IS NULL;
