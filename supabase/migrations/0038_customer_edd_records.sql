-- Migration: 0038_customer_edd_records.sql
-- Purpose: Enhanced Due Diligence (EDD) data capture for high-risk customers.
-- Source: PRD v1.0 §M-06 (Enhanced Due Diligence) + FINAL_LAUNCH_PLAN.md §2.7.
--
-- Surfaced when a case routes to the `edd` queue (risk band HIGH or
-- UNACCEPTABLE per lib/constants/risk.ts). EDD data is collected on top of
-- baseline KYC and is visible only to roles with `customers:read_edd_data`
-- permission (mlro, senior_reviewer, tenant_admin) — analysts and the
-- onboarding agent are intentionally blind.
--
-- Append-only by design. A new EDD submission creates a new version row;
-- earlier rows are preserved for the regulatory retention window.

CREATE TABLE IF NOT EXISTS customer_edd_records (
  id                              UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  tenant_id                       UUID NOT NULL REFERENCES tenants(id),
  customer_id                     UUID NOT NULL REFERENCES customers(id),

  version                         INT  NOT NULL DEFAULT 1,

  -- Free-form narratives. Both required for any EDD submission.
  source_of_wealth_narrative      TEXT NOT NULL
                                    CHECK (length(source_of_wealth_narrative) BETWEEN 10 AND 50000),
  source_of_funds_narrative       TEXT NOT NULL
                                    CHECK (length(source_of_funds_narrative) BETWEEN 10 AND 50000),

  -- Forward-looking activity profile. Used by reviewers to compare
  -- declared expectation vs. observed transactions later in the lifecycle.
  expected_annual_volume_aed      NUMERIC(18,2) CHECK (expected_annual_volume_aed >= 0),
  expected_currencies             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expected_counterparties         TEXT
                                    CHECK (expected_counterparties IS NULL
                                           OR length(expected_counterparties) <= 5000),
  expected_payment_methods        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- PEP details — required if the customer has pep_status=true on baseline KYC.
  -- Free-form so reviewers can capture: title, jurisdiction, time in office,
  -- cessation date, family/associate connections, etc.
  pep_relationship_details        TEXT
                                    CHECK (pep_relationship_details IS NULL
                                           OR length(pep_relationship_details) <= 10000),

  -- Supporting documents. UUID arrays referencing documents.id rows that
  -- the customer / agent uploaded for SoW/SoF evidence (audited financials,
  -- bank statements, salary slips, property titles, etc.). Validated at
  -- the API layer to live in the same tenant.
  supporting_document_ids         UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],

  -- Reviewer's open-text rationale for why EDD is satisfactory (or not).
  -- Captured at submission, not edited after.
  reviewer_rationale              TEXT
                                    CHECK (reviewer_rationale IS NULL
                                           OR length(reviewer_rationale) <= 10000),

  -- Lifecycle. submitted_by is the user who recorded the EDD record (could
  -- be the customer through a future EDD onboarding step, or an MLRO/SR
  -- transcribing from a paper form today).
  submitted_by                    UUID NOT NULL REFERENCES users(id),
  submitted_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (customer_id, version)
);

CREATE INDEX IF NOT EXISTS customer_edd_records_tenant_idx
  ON customer_edd_records (tenant_id, customer_id, version DESC);
CREATE INDEX IF NOT EXISTS customer_edd_records_customer_idx
  ON customer_edd_records (customer_id, version DESC);

-- ============================================================
-- Append-only enforcement (defence-in-depth alongside RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_edd_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'customer_edd_records is append-only. Operation: %. Row ID: %.',
    TG_OP, OLD.id
    USING ERRCODE = 'insufficient_privilege';
  RETURN NULL;
END;
$$;

CREATE TRIGGER customer_edd_records_no_update
  BEFORE UPDATE ON customer_edd_records
  FOR EACH ROW EXECUTE FUNCTION prevent_edd_modification();

CREATE TRIGGER customer_edd_records_no_delete
  BEFORE DELETE ON customer_edd_records
  FOR EACH ROW EXECUTE FUNCTION prevent_edd_modification();

-- ============================================================
-- Row Level Security — read/write restricted by user_role
-- ============================================================

ALTER TABLE customer_edd_records ENABLE ROW LEVEL SECURITY;

-- READ: tenant_admin, mlro, senior_reviewer (mirrors the
-- `customers:read_edd_data` permission in modules/auth/rbac.ts).
-- Analysts and onboarding agents are intentionally blind.
CREATE POLICY "customer_edd_records_read"
  ON customer_edd_records FOR SELECT
  TO authenticated
  USING (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'senior_reviewer', 'tenant_admin')
  );

-- INSERT: same set of roles. The service layer additionally checks
-- `customers:read_edd_data` permission and the customer-tenant binding.
CREATE POLICY "customer_edd_records_insert"
  ON customer_edd_records FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'senior_reviewer', 'tenant_admin')
  );

-- No UPDATE / DELETE policies — append-only.

COMMENT ON TABLE customer_edd_records IS
  'Enhanced Due Diligence records (PRD §M-06). Append-only, versioned per customer. Visible only to MLRO + SR + tenant_admin.';
COMMENT ON COLUMN customer_edd_records.supporting_document_ids IS
  'documents.id references for SoW/SoF evidence. Tenant binding validated at the API layer.';
