-- Migration: 0016_create_approvals.sql
-- Purpose: Approval decisions — immutable once written (one decision per case)
-- Source: DevPlan v1.0 Section 4.8, PRD Section 4.4

CREATE TABLE IF NOT EXISTS approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  case_id         UUID NOT NULL REFERENCES cases(id) UNIQUE, -- one decision per case
  decision        TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  rationale       TEXT NOT NULL,
  decided_by      UUID NOT NULL REFERENCES users(id),
  decided_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Escalation chain (for 2-person MLRO approval rule)
  requires_second_approval BOOLEAN NOT NULL DEFAULT false,
  second_approver UUID REFERENCES users(id),
  second_decided_at TIMESTAMPTZ
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Immutable guard — approval records must never change
CREATE OR REPLACE FUNCTION prevent_approval_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'approvals is immutable: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_approval_update
  BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION prevent_approval_modification();

CREATE TRIGGER no_approval_delete
  BEFORE DELETE ON approvals
  FOR EACH ROW EXECUTE FUNCTION prevent_approval_modification();

CREATE INDEX IF NOT EXISTS approvals_case_id_idx ON approvals (case_id);
CREATE INDEX IF NOT EXISTS approvals_tenant_id_idx ON approvals (tenant_id);


-- RLS policies for M3 tables
-- webhook_events: service role only (API routes handle ingest)
CREATE POLICY "webhook_events_select_admin" ON webhook_events
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin'));

-- screening_jobs
CREATE POLICY "screening_jobs_select_staff" ON screening_jobs
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- screening_hits
CREATE POLICY "screening_hits_select_staff" ON screening_hits
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- screening_hit_resolutions
CREATE POLICY "screening_resolutions_select_staff" ON screening_hit_resolutions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "screening_resolutions_insert_analyst" ON screening_hit_resolutions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- risk_assessments
CREATE POLICY "risk_assessments_select_staff" ON risk_assessments
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- cases: analysts see only assigned; MLRO/admin see all
CREATE POLICY "cases_select_analyst" ON cases
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (
      (auth.jwt() ->> 'role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "cases_update_staff" ON cases
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- case_events
CREATE POLICY "case_events_select_staff" ON case_events
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

CREATE POLICY "case_events_insert_staff" ON case_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- approvals
CREATE POLICY "approvals_select_staff" ON approvals
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

-- Only MLRO and above can record approvals
CREATE POLICY "approvals_insert_mlro" ON approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('mlro', 'tenant_admin', 'platform_super_admin')
  );
