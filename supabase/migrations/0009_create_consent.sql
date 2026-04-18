-- Migration: 0009_create_consent.sql
-- Purpose: Append-only consent capture — legal requirement for AML/KYC data processing
-- Source: PRD Section 4.1, DevPlan Section 8.3

-- Consent records — immutable once written
-- Consent must be captured before any personal data collection
CREATE TABLE IF NOT EXISTS consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  -- Consent purposes
  data_processing BOOLEAN NOT NULL DEFAULT false,
  aml_screening   BOOLEAN NOT NULL DEFAULT false,
  identity_verification BOOLEAN NOT NULL DEFAULT false,
  third_party_sharing   BOOLEAN NOT NULL DEFAULT false,
  -- Capture context
  ip_address      INET,          -- Stored masked to /24
  user_agent      TEXT,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  -- Legal
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Append-only guard: consent records must never be modified or deleted
CREATE OR REPLACE FUNCTION prevent_consent_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'consent_records is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_consent_update
  BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION prevent_consent_modification();

CREATE TRIGGER no_consent_delete
  BEFORE DELETE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION prevent_consent_modification();

CREATE INDEX IF NOT EXISTS consent_records_customer_id_idx ON consent_records (customer_id);
CREATE INDEX IF NOT EXISTS consent_records_tenant_id_idx ON consent_records (tenant_id);
