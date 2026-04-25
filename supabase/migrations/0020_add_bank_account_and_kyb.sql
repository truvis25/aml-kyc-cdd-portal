-- Migration: 0020_add_bank_account_and_kyb.sql
-- Purpose: Add bank account fields to individual KYC, create businesses/business_data_versions
--          for corporate KYB, extend document types, and insert corporate workflow definition.

-- ============================================================
-- Part A: Add bank_account to customer_data_versions
-- ============================================================

ALTER TABLE customer_data_versions
  ADD COLUMN IF NOT EXISTS bank_account JSONB;
-- Structure: { iban, bank_name, account_number, swift_code }
-- All sub-fields are optional strings; validation enforced at application layer.


-- ============================================================
-- Part B: Extend documents.document_type CHECK constraint
-- ============================================================

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN (
    'passport', 'national_id', 'residence_permit', 'driving_licence',
    'proof_of_address', 'bank_statement', 'utility_bill', 'other',
    'emirates_id_front', 'emirates_id_back', 'trade_license'
  ));


-- ============================================================
-- Part C: Create businesses table
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
  id             UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  latest_version INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'suspended')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id)
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS businesses_tenant_id_idx ON businesses (tenant_id);
CREATE INDEX IF NOT EXISTS businesses_customer_id_idx ON businesses (customer_id);
CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses (tenant_id, status);


-- ============================================================
-- Part D: Create business_data_versions (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS business_data_versions (
  id                        UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  business_id               UUID NOT NULL REFERENCES businesses(id),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  version                   INTEGER NOT NULL,
  company_name              TEXT,
  trade_license_number      TEXT,
  jurisdiction              TEXT,
  activity_type             TEXT,
  trade_license_issued_at   DATE,
  trade_license_expires_at  DATE,
  authorized_rep_name       TEXT,
  changed_by                UUID REFERENCES users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, version)
);

ALTER TABLE business_data_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS business_data_business_id_idx ON business_data_versions (business_id);
CREATE INDEX IF NOT EXISTS business_data_tenant_id_idx ON business_data_versions (tenant_id);
CREATE INDEX IF NOT EXISTS business_data_latest_idx ON business_data_versions (business_id, version DESC);

-- Append-only immutability trigger (mirrors customer_data_versions pattern)
CREATE OR REPLACE FUNCTION prevent_business_data_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'business_data_versions is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_business_data_update ON business_data_versions;
CREATE TRIGGER no_business_data_update
  BEFORE UPDATE ON business_data_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_business_data_modification();

DROP TRIGGER IF EXISTS no_business_data_delete ON business_data_versions;
CREATE TRIGGER no_business_data_delete
  BEFORE DELETE ON business_data_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_business_data_modification();


-- ============================================================
-- Part E: RLS policies for businesses and business_data_versions
-- ============================================================

-- businesses
DROP POLICY IF EXISTS "businesses_select_staff" ON businesses;
CREATE POLICY "businesses_select_staff" ON businesses
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

DROP POLICY IF EXISTS "businesses_insert_authenticated" ON businesses;
CREATE POLICY "businesses_insert_authenticated" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

DROP POLICY IF EXISTS "businesses_update_staff" ON businesses;
CREATE POLICY "businesses_update_staff" ON businesses
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id)
  WITH CHECK (
    (auth.jwt() ->> 'tenant_id')::UUID = tenant_id
    AND (auth.jwt() ->> 'role') IN ('analyst', 'senior_reviewer', 'mlro', 'tenant_admin', 'platform_super_admin')
  );

-- business_data_versions (append-only — no UPDATE or DELETE policies)
DROP POLICY IF EXISTS "business_data_select_staff" ON business_data_versions;
CREATE POLICY "business_data_select_staff" ON business_data_versions
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);

DROP POLICY IF EXISTS "business_data_insert_staff" ON business_data_versions;
CREATE POLICY "business_data_insert_staff" ON business_data_versions
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'tenant_id')::UUID = tenant_id);


-- ============================================================
-- Part F: Insert corporate-kyb-standard-v1 workflow definition
-- ============================================================

INSERT INTO workflow_definitions (id, tenant_id, name, customer_type, version, definition, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  NULL,
  'corporate-kyb-standard-v1',
  'corporate',
  1,
  '{
    "id": "corporate-kyb-standard-v1",
    "version": 1,
    "customer_type": "corporate",
    "steps": [
      {
        "id": "consent",
        "title": "Consent & Disclosures",
        "type": "consent",
        "required": true,
        "fields": ["data_processing", "aml_screening", "identity_verification", "third_party_sharing"],
        "next": "business-info"
      },
      {
        "id": "business-info",
        "title": "Business Information",
        "type": "kyb_form",
        "required": true,
        "fields": [
          "company_name", "trade_license_number", "jurisdiction", "activity_type",
          "trade_license_issued_at", "trade_license_expires_at", "authorized_rep_name"
        ],
        "next": "documents"
      },
      {
        "id": "documents",
        "title": "Business Documents",
        "type": "document_upload",
        "required": true,
        "document_requirements": [
          {"type": "trade_license", "label": "Trade License", "required": true},
          {"type": "emirates_id_front", "label": "Emirates ID (Front)", "required": true},
          {"type": "emirates_id_back", "label": "Emirates ID (Back)", "required": true}
        ],
        "next": "complete"
      },
      {
        "id": "complete",
        "title": "Submission Complete",
        "type": "completion",
        "required": false,
        "next": null
      }
    ]
  }'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
