-- Migration: 0001_create_tenants.sql
-- Purpose: Tenant registry — the root entity for all multi-tenant data
-- Source: DevPlan v1.0 Section 3.2, Section 3.4

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pg_cron is enabled at cluster level — no need to CREATE EXTENSION here

CREATE TABLE IF NOT EXISTS tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'suspended', 'inactive')),
  settings   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Platform super-admin (service role) reads all tenants — no RLS policy needed for service role
-- Authenticated users can only read their own tenant
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  TO authenticated
  USING (id = (auth.jwt() ->> 'tenant_id')::UUID);

-- Tenants can only be created by the platform super-admin (service role)
-- No INSERT policy for authenticated role
-- No UPDATE policy for authenticated role (admin updates go through service role)
-- No DELETE policy — tenants are never hard-deleted

-- Index for fast tenant lookup
CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants (slug);
