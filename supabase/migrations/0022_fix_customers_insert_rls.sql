-- Migration: 0022_fix_customers_insert_rls.sql
-- The customers table was created without an INSERT policy for authenticated users.
-- The original intent was "service role only" but the onboarding API uses the
-- authenticated server client, so RLS blocks all customer creation.
-- This migration adds the missing INSERT policy so onboarding staff can create customers.

DROP POLICY IF EXISTS "customers_insert_staff" ON customers;
CREATE POLICY "customers_insert_staff" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'user_role') IN (
      'onboarding_agent', 'analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin'
    )
  );
