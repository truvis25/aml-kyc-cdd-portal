-- Migration: 0029_create_notification_events.sql
-- Purpose: Append-only audit trail for outbound notifications (email, future SMS)
-- Source: Sprint A — Phase 2 closeout, ROLES_DASHBOARDS_FLOWS.md §8 (RAI flow), §11 email integration

CREATE TABLE IF NOT EXISTS notification_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  case_id               UUID REFERENCES cases(id),
  customer_id           UUID REFERENCES customers(id),
  channel               TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  template              TEXT NOT NULL,            -- 'rai' | 'approval' | 'rejection' | future
  recipient_hash        TEXT NOT NULL,            -- SHA-256 of recipient address; never stores raw PII
  provider              TEXT NOT NULL,            -- 'resend' | future
  provider_message_id   TEXT,                     -- Resend message id; null until sent
  status                TEXT NOT NULL DEFAULT 'queued'
                          CHECK (status IN ('queued', 'sent', 'failed')),
  error                 TEXT,                     -- short error code/category; never stores stack traces
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notification_events_tenant_id_idx ON notification_events (tenant_id);
CREATE INDEX IF NOT EXISTS notification_events_case_id_idx ON notification_events (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_events_customer_id_idx ON notification_events (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_events_status_idx ON notification_events (tenant_id, status);

-- Append-only guard: status updates from queued→sent/failed are permitted only
-- via a fixed-shape UPDATE (the row stays immutable in every other respect).
-- For simplicity we forbid UPDATE/DELETE entirely; status transitions are
-- captured by inserting a new row when needed. The send path inserts directly
-- in its terminal state ('sent' or 'failed').
CREATE OR REPLACE FUNCTION prevent_notification_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'notification_events is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_notification_event_update
  BEFORE UPDATE ON notification_events
  FOR EACH ROW EXECUTE FUNCTION prevent_notification_event_modification();

CREATE TRIGGER no_notification_event_delete
  BEFORE DELETE ON notification_events
  FOR EACH ROW EXECUTE FUNCTION prevent_notification_event_modification();

-- RLS: staff with tenant access can read; only authenticated tenant staff can insert.
CREATE POLICY "notification_events_select_staff" ON notification_events
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "notification_events_insert_staff" ON notification_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );
