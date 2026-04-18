-- Migration: 0011_create_workflows.sql
-- Purpose: Versioned workflow definitions — JSON-driven step sequencing for onboarding
-- Source: DevPlan v1.0 Section 5.1.1

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,           -- NULL = platform default; non-NULL = tenant override
  name            TEXT NOT NULL,
  customer_type   TEXT NOT NULL DEFAULT 'individual'
                    CHECK (customer_type IN ('individual', 'corporate')),
  version         INTEGER NOT NULL DEFAULT 1,
  definition      JSONB NOT NULL, -- WorkflowDefinition JSON (steps, branches, conditions)
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, customer_type, version)
);

ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;

-- Add FK from onboarding_sessions now that workflow_definitions exists
ALTER TABLE onboarding_sessions
  ADD CONSTRAINT onboarding_sessions_workflow_id_fkey
  FOREIGN KEY (workflow_id) REFERENCES workflow_definitions(id);

CREATE INDEX IF NOT EXISTS workflow_definitions_tenant_idx ON workflow_definitions (tenant_id, customer_type) WHERE is_active = true;


-- Default individual KYC workflow (platform-level, tenant_id = NULL)
-- Steps: consent → identity → documents → complete
INSERT INTO workflow_definitions (id, tenant_id, name, customer_type, version, definition, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'individual-kyc-standard-v1',
  'individual',
  1,
  '{
    "id": "individual-kyc-standard-v1",
    "version": 1,
    "customer_type": "individual",
    "steps": [
      {
        "id": "consent",
        "title": "Consent & Disclosures",
        "type": "consent",
        "required": true,
        "fields": ["data_processing", "aml_screening", "identity_verification", "third_party_sharing"],
        "next": "identity"
      },
      {
        "id": "identity",
        "title": "Personal Information",
        "type": "kyc_form",
        "required": true,
        "fields": [
          "full_name", "date_of_birth", "nationality", "country_of_residence",
          "id_type", "id_number", "id_expiry", "id_issuing_country",
          "email", "phone", "address_line1", "city", "postal_code", "country",
          "occupation", "source_of_funds", "purpose_of_relationship",
          "pep_status"
        ],
        "next": "documents"
      },
      {
        "id": "documents",
        "title": "Identity Documents",
        "type": "document_upload",
        "required": true,
        "document_requirements": [
          {"type": "passport", "label": "Passport or National ID", "required": true, "alternatives": ["national_id", "residence_permit"]},
          {"type": "proof_of_address", "label": "Proof of Address", "required": false}
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
