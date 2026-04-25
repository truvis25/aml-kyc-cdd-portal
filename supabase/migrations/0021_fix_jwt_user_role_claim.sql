-- Migration: 0021_fix_jwt_user_role_claim.sql
-- Root-cause fix: the custom_access_token_hook was overwriting the JWT 'role' claim
-- with the application role (e.g. 'analyst'). Supabase PostgREST uses 'role' to
-- SET the Postgres database role — 'analyst' is not a Postgres role, so every
-- database query silently failed, blocking sign-in and all platform pages.
--
-- Fix: store the application role in a new 'user_role' claim, leaving
-- 'role: "authenticated"' intact so PostgREST can function normally.
-- All RLS policies that checked 'role' for application-level access are updated
-- to check 'user_role' instead.

-- ============================================================
-- Part 1: Replace custom_access_token_hook
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

  SELECT ur.tenant_id, r.name
    INTO v_tenant_id, v_role_name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
   WHERE ur.user_id = v_user_id
     AND ur.revoked_at IS NULL
   ORDER BY ur.granted_at DESC
   LIMIT 1;

  -- No active role → return event unchanged (PostgREST will use 'authenticated')
  IF v_tenant_id IS NULL THEN
    RETURN event;
  END IF;

  SELECT mfa_enabled INTO v_mfa_enabled FROM users WHERE id = v_user_id;
  v_mfa_enabled := COALESCE(v_mfa_enabled, false);

  v_permissions := CASE v_role_name
    WHEN 'platform_super_admin' THEN ARRAY[
      'admin:view_all_tenants', 'admin:manage_config', 'audit:read', 'audit:export'
    ]
    WHEN 'tenant_admin' THEN ARRAY[
      'admin:manage_users', 'admin:manage_config', 'admin:activate_workflow',
      'cases:read_all', 'customers:read_all', 'documents:read', 'screening:read',
      'risk:read', 'audit:read', 'audit:export', 'reporting:read_aggregate',
      'onboarding:write', 'onboarding:read'
    ]
    WHEN 'mlro' THEN ARRAY[
      'cases:read_all', 'cases:read_high_risk', 'cases:add_note',
      'cases:request_additional_info', 'cases:escalate', 'cases:approve_standard',
      'cases:approve_high_risk', 'cases:reject', 'cases:view_sar_status',
      'customers:read_all', 'customers:read_edd_data', 'documents:read',
      'screening:read', 'screening:resolve_hit', 'risk:read', 'risk:configure',
      'audit:read', 'audit:export', 'reporting:read_aggregate',
      'onboarding:write', 'onboarding:read'
    ]
    WHEN 'senior_reviewer' THEN ARRAY[
      'cases:read_assigned', 'cases:add_note', 'cases:request_additional_info',
      'cases:escalate', 'cases:approve_standard', 'cases:approve_high_risk',
      'cases:reject', 'customers:read_assigned', 'customers:read_edd_data',
      'documents:read', 'screening:read', 'screening:resolve_hit', 'risk:read',
      'reporting:read_aggregate', 'onboarding:write', 'onboarding:read'
    ]
    WHEN 'analyst' THEN ARRAY[
      'cases:read_assigned', 'cases:add_note', 'cases:request_additional_info',
      'cases:escalate', 'cases:approve_standard', 'cases:reject',
      'customers:read_assigned', 'documents:read', 'screening:read',
      'screening:resolve_hit', 'risk:read', 'onboarding:write', 'onboarding:read'
    ]
    WHEN 'onboarding_agent' THEN ARRAY[
      'onboarding:initiate', 'onboarding:assist_customer', 'onboarding:write',
      'onboarding:read', 'documents:upload'
    ]
    WHEN 'read_only' THEN ARRAY['reporting:read_aggregate']
    ELSE ARRAY[]::text[]
  END;

  claims := event -> 'claims';
  -- Use 'user_role' — do NOT overwrite 'role' which PostgREST uses for SET ROLE
  claims := jsonb_set(claims, '{user_role}',   to_jsonb(v_role_name));
  claims := jsonb_set(claims, '{tenant_id}',   to_jsonb(v_tenant_id));
  claims := jsonb_set(claims, '{mfa_verified}', to_jsonb(v_mfa_enabled));
  claims := jsonb_set(claims, '{permissions}',  to_jsonb(v_permissions));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'custom_access_token_hook error for user %: %', v_user_id, SQLERRM;
    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook FROM PUBLIC;


-- ============================================================
-- Part 2: Update RLS policies — replace 'role' with 'user_role'
-- ============================================================

-- customers
DROP POLICY IF EXISTS "customers_update_staff" ON customers;
CREATE POLICY "customers_update_staff" ON customers
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- documents
DROP POLICY IF EXISTS "documents_update_staff" ON documents;
CREATE POLICY "documents_update_staff" ON documents
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- workflow_definitions
DROP POLICY IF EXISTS "workflow_definitions_insert_admin" ON workflow_definitions;
CREATE POLICY "workflow_definitions_insert_admin" ON workflow_definitions
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'platform_super_admin')
    AND (
      (tenant_id IS NULL AND (auth.jwt() ->> 'user_role') = 'platform_super_admin')
      OR (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    )
  );

-- user_roles
DROP POLICY IF EXISTS "user_roles_insert_admin" ON user_roles;
CREATE POLICY "user_roles_insert_admin" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'platform_super_admin')
  );

-- audit_log
DROP POLICY IF EXISTS "audit_log_select_compliance" ON audit_log;
CREATE POLICY "audit_log_select_compliance" ON audit_log
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
  );

-- businesses
DROP POLICY IF EXISTS "businesses_update_staff" ON businesses;
CREATE POLICY "businesses_update_staff" ON businesses
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- approval_workflows
DROP POLICY IF EXISTS "approvals_select_admin" ON approval_workflows;
CREATE POLICY "approvals_select_admin" ON approval_workflows
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('tenant_admin', 'platform_super_admin'));

DROP POLICY IF EXISTS "approvals_insert_staff" ON approval_workflows;
CREATE POLICY "approvals_insert_staff" ON approval_workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

DROP POLICY IF EXISTS "approvals_update_reviewer" ON approval_workflows;
CREATE POLICY "approvals_update_reviewer" ON approval_workflows
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (
      (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
      OR (
        (auth.jwt() ->> 'user_role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
      )
    )
  );

-- ============================================================
-- Part 3: Update audit trigger to record user_role
-- ============================================================

CREATE OR REPLACE FUNCTION record_audit_actor()
RETURNS TRIGGER AS $$
BEGIN
  -- Record the application role (user_role claim), fall back to 'system'
  NEW.actor_role := COALESCE(auth.jwt() ->> 'user_role', 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
