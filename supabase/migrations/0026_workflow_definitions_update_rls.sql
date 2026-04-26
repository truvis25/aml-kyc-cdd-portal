-- Migration: 0026_workflow_definitions_update_rls.sql
-- Adds UPDATE policy so tenant_admin can activate/deactivate workflow definitions
-- for their own tenant. Platform-level workflows (tenant_id IS NULL) can only
-- be toggled by platform_super_admin.

DROP POLICY IF EXISTS "workflow_definitions_update_admin" ON workflow_definitions;
CREATE POLICY "workflow_definitions_update_admin" ON workflow_definitions
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'platform_super_admin')
    AND (
      (tenant_id IS NULL AND (auth.jwt() ->> 'user_role') = 'platform_super_admin')
      OR ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'platform_super_admin')
    AND (
      (tenant_id IS NULL AND (auth.jwt() ->> 'user_role') = 'platform_super_admin')
      OR ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
    )
  );
