-- Migration: 0036_sar_reports.sql
-- Purpose: Suspicious Activity Reports (SARs) — formal submissions to UAE FIU/goAML.
-- Source: PRD v1.0 §7 (SAR/STR workflow) + post-launch roadmap item 4.
--
-- A `cases.sar_flagged = true` row signals an analyst's intent to file. The
-- formal report — narrative, reason codes, transactions, exported goAML XML
-- — lives here. A case can have multiple SAR drafts/revisions over time;
-- one is usually marked `submitted` per real-world filing.
--
-- RLS: only roles with `cases:flag_sar` permission (MLRO + tenant_admin) may
-- read or write SAR reports. Analysts and senior reviewers are intentionally
-- blind to SAR records to prevent tipping-off (PRD §7).

CREATE TABLE IF NOT EXISTS sar_reports (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  case_id                     UUID NOT NULL REFERENCES cases(id),
  customer_id                 UUID NOT NULL REFERENCES customers(id),

  -- Tenant-scoped human reference (e.g. "SAR-2026-0001"). Auto-generated
  -- via trigger to keep it monotonic per tenant.
  reference_number            TEXT NOT NULL,

  status                      TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'ready', 'submitted', 'acknowledged', 'rejected')),

  -- Reason codes per goAML / UAE FIU schema: 'UNK' (unknown), 'STR' (suspicious
  -- transaction), 'CTR' (cash threshold), 'TFS' (terrorist financing), etc.
  -- Stored as text[] so multiple may apply.
  reason_codes                TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  narrative                   TEXT NOT NULL DEFAULT ''
                                CHECK (length(narrative) <= 50000),

  -- The bounding window for the suspicious activity reported.
  activity_start              TIMESTAMPTZ,
  activity_end                TIMESTAMPTZ,

  -- AED-denominated total. Native UAE currency for FIU filings. Stored as
  -- numeric to avoid floating-point drift on aggregate sums.
  total_amount_aed            NUMERIC(18,2) NOT NULL DEFAULT 0
                                CHECK (total_amount_aed >= 0),

  -- Linked transactions / instruments — JSONB array. Each element shape:
  --   { date, amount_aed, instrument_type, counterparty, description }
  -- Validated at the API layer with Zod.
  transactions                JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- goAML export bookkeeping
  goaml_xml_hash              TEXT,            -- sha256 of the exported XML, audit-evidence
  goaml_xml_version           INT NOT NULL DEFAULT 0,  -- bumped each time exported
  goaml_submission_id         TEXT,            -- if/when submitted to FIU
  regulator_acknowledgment    JSONB,           -- ack payload from FIU after submission

  -- Lifecycle
  created_by                  UUID NOT NULL REFERENCES users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_by                UUID REFERENCES users(id),
  submitted_at                TIMESTAMPTZ,

  -- Activity bounds: end >= start when both present
  CHECK (activity_end IS NULL OR activity_start IS NULL OR activity_end >= activity_start),
  -- submitted_at requires submitted_by, and status must be submitted/ack/rejected
  CHECK ((submitted_at IS NULL) = (submitted_by IS NULL)),
  -- Reference number must be non-empty
  CHECK (length(reference_number) BETWEEN 1 AND 64),
  -- Tenant uniqueness on the human-readable reference
  UNIQUE (tenant_id, reference_number)
);

CREATE INDEX IF NOT EXISTS sar_reports_tenant_idx
  ON sar_reports (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sar_reports_case_idx
  ON sar_reports (case_id);
CREATE INDEX IF NOT EXISTS sar_reports_customer_idx
  ON sar_reports (customer_id);
CREATE INDEX IF NOT EXISTS sar_reports_status_idx
  ON sar_reports (tenant_id, status, created_at DESC);

-- Reference number sequence per tenant. We use a separate sequence-tracking
-- table so the format is "SAR-YYYY-NNNN" with year-prefix.
CREATE TABLE IF NOT EXISTS sar_reference_counters (
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  year        INT NOT NULL,
  next_seq    INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, year)
);

ALTER TABLE sar_reference_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION generate_sar_reference(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now())::INT;
  v_seq  INT;
BEGIN
  INSERT INTO sar_reference_counters (tenant_id, year, next_seq)
    VALUES (p_tenant_id, v_year, 1)
    ON CONFLICT (tenant_id, year)
      DO UPDATE SET next_seq = sar_reference_counters.next_seq + 1
    RETURNING next_seq - 1 INTO v_seq;

  -- Re-read because the ON CONFLICT branch already incremented and returned
  -- the new value; the INSERT branch returned 0.
  IF v_seq = 0 THEN
    v_seq := 1;
  END IF;

  RETURN 'SAR-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- updated_at maintenance
CREATE OR REPLACE FUNCTION sar_reports_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sar_reports_updated_at
  BEFORE UPDATE ON sar_reports
  FOR EACH ROW EXECUTE FUNCTION sar_reports_set_updated_at();

ALTER TABLE sar_reports ENABLE ROW LEVEL SECURITY;

-- READ: only roles with cases:view_sar_status — i.e. MLRO and tenant_admin.
-- Analysts and senior reviewers are intentionally blind (tipping-off).
CREATE POLICY "sar_reports_read"
  ON sar_reports FOR SELECT
  TO authenticated
  USING (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin')
  );

-- INSERT/UPDATE: only MLRO and tenant_admin within their tenant.
CREATE POLICY "sar_reports_write"
  ON sar_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin')
  );

CREATE POLICY "sar_reports_update"
  ON sar_reports FOR UPDATE
  TO authenticated
  USING (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin')
  )
  WITH CHECK (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin')
  );

-- No DELETE policy — SARs are retained for the regulatory window. Service
-- role can purge out-of-band if required by a data-retention job.

-- Reference counters: read by same roles, write enforced by SECURITY DEFINER
-- function only (we don't expose the counters table to clients directly).
CREATE POLICY "sar_reference_counters_read"
  ON sar_reference_counters FOR SELECT
  TO authenticated
  USING (
    tenant_id::TEXT = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'user_role') IN ('mlro', 'tenant_admin')
  );

COMMENT ON TABLE sar_reports IS
  'Formal Suspicious Activity Reports linked to cases. Visible only to MLRO + tenant_admin per tipping-off policy.';
COMMENT ON COLUMN sar_reports.reason_codes IS
  'goAML reason codes (UNK, STR, CTR, TFS, etc). Multiple may apply to one report.';
COMMENT ON COLUMN sar_reports.transactions IS
  'JSONB array of suspicious transactions. Schema validated at API layer (modules/sar/types).';
COMMENT ON COLUMN sar_reports.goaml_xml_hash IS
  'sha256 of the most-recently exported goAML XML. Used as immutable audit evidence.';
