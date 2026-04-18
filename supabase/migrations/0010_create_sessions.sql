-- Migration: 0010_create_sessions.sql
-- Purpose: Resumable onboarding sessions — track workflow position and step data
-- Source: DevPlan v1.0 Section 5.1

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  customer_id       UUID NOT NULL REFERENCES customers(id),
  workflow_id       UUID,          -- FK to workflow_definitions added in 0011
  status            TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress', 'paused', 'submitted', 'approved', 'rejected', 'expired')),
  current_step      TEXT NOT NULL DEFAULT 'consent',
  completed_steps   TEXT[] NOT NULL DEFAULT '{}',
  step_data         JSONB NOT NULL DEFAULT '{}',  -- Non-PII step metadata only
  -- Resumability
  token             TEXT UNIQUE,                   -- Opaque resume token (sent via email)
  token_expires_at  TIMESTAMPTZ,
  -- Lifecycle
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '72 hours')
);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS sessions_customer_id_idx ON onboarding_sessions (customer_id);
CREATE INDEX IF NOT EXISTS sessions_tenant_id_idx ON onboarding_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_status_idx ON onboarding_sessions (tenant_id, status);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON onboarding_sessions (token) WHERE token IS NOT NULL;
