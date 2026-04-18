-- Migration: 0015_create_cases.sql
-- Purpose: Case management — compliance review queue and append-only event log
-- Source: DevPlan v1.0 Section 4.7, PRD Section 4.4

CREATE TABLE IF NOT EXISTS cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  session_id          UUID REFERENCES onboarding_sessions(id),
  risk_assessment_id  UUID REFERENCES risk_assessments(id),
  queue               TEXT NOT NULL DEFAULT 'standard'
                        CHECK (queue IN ('standard', 'edd', 'escalation', 'senior')),
  status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'in_review', 'pending_info', 'escalated', 'approved', 'rejected', 'closed')),
  assigned_to         UUID REFERENCES users(id),
  sar_flagged         BOOLEAN NOT NULL DEFAULT false,   -- Suspicious Activity Report flag
  -- Lifecycle
  opened_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at           TIMESTAMPTZ
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS cases_tenant_id_idx ON cases (tenant_id);
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS cases_assigned_to_idx ON cases (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS cases_queue_idx ON cases (tenant_id, queue, status);


-- Case events — append-only timeline of all actions on a case
CREATE TABLE IF NOT EXISTS case_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  case_id     UUID NOT NULL REFERENCES cases(id),
  event_type  TEXT NOT NULL,   -- 'note', 'status_change', 'request_additional_info', 'escalation', 'assignment'
  actor_id    UUID REFERENCES users(id),
  actor_role  TEXT,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Append-only guard
CREATE OR REPLACE FUNCTION prevent_case_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'case_events is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_case_event_update
  BEFORE UPDATE ON case_events
  FOR EACH ROW EXECUTE FUNCTION prevent_case_event_modification();

CREATE TRIGGER no_case_event_delete
  BEFORE DELETE ON case_events
  FOR EACH ROW EXECUTE FUNCTION prevent_case_event_modification();

CREATE INDEX IF NOT EXISTS case_events_case_id_idx ON case_events (case_id);
CREATE INDEX IF NOT EXISTS case_events_tenant_id_idx ON case_events (tenant_id);
