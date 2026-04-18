-- Migration: 0007_create_customers.sql
-- Purpose: Customer profiles and append-only data versioning
-- Source: DevPlan v1.0 Section 4.3, PRD Section 4.1.1

-- Core customer record — identity anchor, minimal mutable fields
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  customer_type   TEXT NOT NULL DEFAULT 'individual'
                    CHECK (customer_type IN ('individual', 'corporate')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'suspended')),
  latest_version  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS customers_tenant_id_idx ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers (tenant_id, status);


-- Append-only KYC field history — never UPDATE this table
-- Each PATCH to customer data creates a new row; previous rows are immutable
CREATE TABLE IF NOT EXISTS customer_data_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  version         INTEGER NOT NULL,
  -- Identity fields (PRD Section 4.1.1)
  full_name       TEXT,
  date_of_birth   DATE,
  nationality     TEXT,         -- ISO 3166-1 alpha-2
  country_of_residence TEXT,    -- ISO 3166-1 alpha-2
  id_type         TEXT CHECK (id_type IN ('passport', 'national_id', 'residence_permit', 'driving_licence')),
  id_number       TEXT,
  id_expiry       DATE,
  id_issuing_country TEXT,      -- ISO 3166-1 alpha-2
  -- Contact
  email           TEXT,
  phone           TEXT,
  address_line1   TEXT,
  address_line2   TEXT,
  city            TEXT,
  postal_code     TEXT,
  country         TEXT,
  -- Compliance fields
  occupation      TEXT,
  employer        TEXT,
  pep_status      BOOLEAN NOT NULL DEFAULT false,
  pep_details     TEXT,
  dual_nationality TEXT,        -- ISO 3166-1 alpha-2 or NULL
  source_of_funds TEXT,
  purpose_of_relationship TEXT,
  -- Metadata
  submitted_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, version)
);

ALTER TABLE customer_data_versions ENABLE ROW LEVEL SECURITY;

-- Append-only guard: no updates or deletes
CREATE OR REPLACE FUNCTION prevent_customer_data_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'customer_data_versions is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_customer_data_update
  BEFORE UPDATE ON customer_data_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_customer_data_modification();

CREATE TRIGGER no_customer_data_delete
  BEFORE DELETE ON customer_data_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_customer_data_modification();

CREATE INDEX IF NOT EXISTS customer_data_customer_id_idx ON customer_data_versions (customer_id);
CREATE INDEX IF NOT EXISTS customer_data_tenant_id_idx ON customer_data_versions (tenant_id);
CREATE INDEX IF NOT EXISTS customer_data_latest_idx ON customer_data_versions (customer_id, version DESC);
