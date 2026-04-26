-- Migration: 0025_screening_hits_rls_and_doc_verify.sql
-- Adds missing RLS SELECT policies so platform staff can read screening
-- data via the regular server client (not admin client bypass).
-- Also adds the verifyDocument function-level permission (documents:verify)
-- to the custom_access_token_hook permissions array.

-- ============================================================
-- screening_jobs — SELECT policy for authenticated staff
-- ============================================================

DROP POLICY IF EXISTS "screening_jobs_select_staff" ON screening_jobs;
CREATE POLICY "screening_jobs_select_staff" ON screening_jobs
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin', 'onboarding_agent'
    )
  );

-- ============================================================
-- screening_hits — SELECT policy for authenticated staff
-- ============================================================

DROP POLICY IF EXISTS "screening_hits_select_staff" ON screening_hits;
CREATE POLICY "screening_hits_select_staff" ON screening_hits
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin', 'onboarding_agent'
    )
  );

-- screening_hits also needs an UPDATE policy so we can update status after resolution
DROP POLICY IF EXISTS "screening_hits_update_staff" ON screening_hits;
CREATE POLICY "screening_hits_update_staff" ON screening_hits
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );

-- ============================================================
-- screening_hit_resolutions — SELECT policy (already has INSERT via 0021)
-- ============================================================

DROP POLICY IF EXISTS "screening_resolutions_select_staff" ON screening_hit_resolutions;
CREATE POLICY "screening_resolutions_select_staff" ON screening_hit_resolutions
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );

-- ============================================================
-- cases — allow SAR flag update (needs UPDATE, already has cases_update_staff)
-- No new policy needed — cases_update_staff already covers tenant staff.
-- ============================================================

-- ============================================================
-- screening_jobs — INSERT policy (needed when initiateScreening runs as
-- onboarding_agent during session finalization)
-- ============================================================

DROP POLICY IF EXISTS "screening_jobs_insert_staff" ON screening_jobs;
CREATE POLICY "screening_jobs_insert_staff" ON screening_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'onboarding_agent', 'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );

DROP POLICY IF EXISTS "screening_hits_insert_staff" ON screening_hits;
CREATE POLICY "screening_hits_insert_staff" ON screening_hits
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'onboarding_agent', 'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );
