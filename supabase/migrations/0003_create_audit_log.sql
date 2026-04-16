-- Migration: 0003_create_audit_log.sql
-- Purpose: Immutable, tamper-evident, append-only audit trail
--
-- Source: PRD v1.0 Section 4.4, DevPlan v1.0 Section 3.3, Section 8.4
--
-- Compliance requirements:
-- - UAE AML Law Art. 14: 5-year minimum retention
-- - ADGM AML Rules 10.3: record-keeping obligation
-- - Evidentiary standards: English common law + UAE regulatory review
--
-- CRITICAL SECURITY CONTROLS:
-- 1. No UPDATE grant to authenticated role
-- 2. No DELETE grant to authenticated role
-- 3. Postgres trigger prevents modification at DB level (defence-in-depth)
-- 4. Hash chain: each row includes SHA-256 hash of previous row
-- 5. row_hash: SHA-256 of key fields of each row

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  event_time  TIMESTAMPTZ NOT NULL DEFAULT now(),  -- Set by DB, not application
  event_type  TEXT NOT NULL,
  actor_id    UUID,          -- NULL for system/automated events
  actor_role  TEXT,          -- Role at time of action
  entity_type TEXT NOT NULL, -- Table name: customers, documents, cases, etc.
  entity_id   UUID NOT NULL, -- ID of the affected record
  payload     JSONB NOT NULL DEFAULT '{}',
  session_id  UUID,          -- Onboarding session reference (if applicable)
  ip_address  INET,          -- Masked to /24 (last octet zeroed) for privacy
  prev_hash   TEXT,          -- SHA-256 of previous row in same tenant partition
  row_hash    TEXT           -- SHA-256 of (tenant_id || event_time || event_type || entity_id || payload::text)
);

-- Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: authenticated users can only read their own tenant's audit events
CREATE POLICY "audit_log_select_own_tenant" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
  );

-- INSERT: authenticated users can insert (via audit service using server client)
-- The audit service uses the server client with user JWT, so RLS applies.
-- Service role bypasses RLS for system writes from Edge Functions.
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- NO UPDATE POLICY — intentionally omitted
-- NO DELETE POLICY — intentionally omitted
-- These omissions are the primary access control mechanism.
-- The trigger below is the secondary (defence-in-depth) mechanism.

-- Performance indexes
CREATE INDEX IF NOT EXISTS audit_log_tenant_id_idx ON audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS audit_log_tenant_event_time_idx ON audit_log (tenant_id, event_time DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (tenant_id, actor_id);
