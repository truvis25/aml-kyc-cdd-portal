-- Migration: 0012_rls_m2_policies.sql
-- Purpose: RLS policies for all M2 tables
-- Source: DevPlan v1.0 Section 7.2

-- ============================================================
-- customers
-- ============================================================

-- Authenticated staff (analysts, admins, MLRO) see customers in their tenant
CREATE POLICY "customers_select_staff" ON customers
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- Service role can insert (used by onboarding initiation)
-- No INSERT policy for authenticated role; API route uses service role for customer creation

-- Status updates by authenticated staff in same tenant with sufficient role
CREATE POLICY "customers_update_staff" ON customers
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );


-- ============================================================
-- customer_data_versions
-- ============================================================

CREATE POLICY "customer_data_select_staff" ON customer_data_versions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- INSERT allowed for authenticated staff (API validates customer ownership)
CREATE POLICY "customer_data_insert_staff" ON customer_data_versions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- No UPDATE policy — append-only (trigger enforces this at DB level too)
-- No DELETE policy — append-only


-- ============================================================
-- documents
-- ============================================================

CREATE POLICY "documents_select_staff" ON documents
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "documents_insert_authenticated" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- Status updates by staff
CREATE POLICY "documents_update_staff" ON documents
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );


-- ============================================================
-- document_events
-- ============================================================

CREATE POLICY "document_events_select_staff" ON document_events
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "document_events_insert_authenticated" ON document_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- No UPDATE, No DELETE — append-only (trigger also enforces)


-- ============================================================
-- consent_records
-- ============================================================

CREATE POLICY "consent_records_select_staff" ON consent_records
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- INSERT: service role only in production; for anon onboarding flow this goes via API route
CREATE POLICY "consent_records_insert_authenticated" ON consent_records
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- No UPDATE, No DELETE — append-only (trigger also enforces)


-- ============================================================
-- onboarding_sessions
-- ============================================================

CREATE POLICY "sessions_select_staff" ON onboarding_sessions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "sessions_insert_authenticated" ON onboarding_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "sessions_update_authenticated" ON onboarding_sessions
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);


-- ============================================================
-- workflow_definitions
-- ============================================================

-- All authenticated users can read active workflow definitions for their tenant + platform defaults
CREATE POLICY "workflow_definitions_select_authenticated" ON workflow_definitions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL  -- platform defaults
    OR (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
  );

-- Only platform super admin or tenant admin can manage workflows
CREATE POLICY "workflow_definitions_insert_admin" ON workflow_definitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
    AND (
      tenant_id IS NULL AND (auth.jwt() ->> 'role') = 'platform_super_admin'
      OR (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    )
  );
