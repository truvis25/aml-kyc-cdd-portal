-- Migration: 0027_senior_reviewer_approval_rls.sql
--
-- Grants senior_reviewer the ability to insert approval records in the DB,
-- matching the updated RBAC grant of cases:approve_standard + cases:reject.
--
-- Before this migration, senior_reviewer could not record final decisions
-- even if the application layer permitted it.

DROP POLICY IF EXISTS "approvals_insert_mlro" ON approvals;
CREATE POLICY "approvals_insert_mlro" ON approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );
