-- Migration: 0024_fix_cases_rls_insert.sql
-- Fixes two missing RLS policies that blocked session finalization:
--
-- 1. cases table had no INSERT policy — openCase() was always blocked,
--    causing "Failed to advance session" after document submission.
--
-- 2. case_events INSERT policy excluded 'onboarding_agent' — the role
--    that triggers finalization via the workflow engine advance() call.

-- ============================================================
-- cases INSERT policy
-- All staff roles that can finalize an onboarding session may open a case.
-- onboarding_agent is explicitly included because finalizeSubmittedSession
-- inserts the initial case record.
-- ============================================================

DROP POLICY IF EXISTS "cases_insert_staff" ON cases;
CREATE POLICY "cases_insert_staff" ON cases
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'onboarding_agent', 'analyst', 'senior_reviewer',
      'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );

-- ============================================================
-- case_events INSERT policy — extend to include onboarding_agent
-- The workflow engine emits case events when opening a case during
-- session finalization, which runs under the onboarding_agent role.
-- ============================================================

DROP POLICY IF EXISTS "case_events_insert_staff" ON case_events;
CREATE POLICY "case_events_insert_staff" ON case_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'onboarding_agent', 'analyst', 'senior_reviewer',
      'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );
