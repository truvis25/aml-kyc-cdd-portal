-- Migration: 0014_create_risk.sql
-- Purpose: Risk assessment results — immutable once written
-- Source: DevPlan v1.0 Section 4.6, PRD Section 4.3

-- Risk assessments — one row per assessment run; never updated
CREATE TABLE IF NOT EXISTS risk_assessments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  -- Composite score
  composite_score     NUMERIC(5,2) NOT NULL,           -- 0-100
  risk_band           TEXT NOT NULL
                        CHECK (risk_band IN ('low', 'medium', 'high', 'unacceptable')),
  -- Dimension scores (0-100 per dimension)
  customer_score      NUMERIC(5,2),
  geographic_score    NUMERIC(5,2),
  product_score       NUMERIC(5,2),
  -- Explainability
  factor_breakdown    JSONB NOT NULL DEFAULT '{}',      -- per-factor scores and reasons
  -- Versioning
  version             INTEGER NOT NULL DEFAULT 1,
  assessed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessed_by         TEXT NOT NULL DEFAULT 'system'   -- 'system' or user UUID
);

ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Immutable guard — risk history is sacred for audit
CREATE OR REPLACE FUNCTION prevent_risk_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'risk_assessments is immutable: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_risk_update
  BEFORE UPDATE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION prevent_risk_modification();

CREATE TRIGGER no_risk_delete
  BEFORE DELETE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION prevent_risk_modification();

CREATE INDEX IF NOT EXISTS risk_assessments_customer_id_idx ON risk_assessments (customer_id);
CREATE INDEX IF NOT EXISTS risk_assessments_tenant_id_idx ON risk_assessments (tenant_id);
CREATE INDEX IF NOT EXISTS risk_assessments_latest_idx ON risk_assessments (customer_id, assessed_at DESC);
