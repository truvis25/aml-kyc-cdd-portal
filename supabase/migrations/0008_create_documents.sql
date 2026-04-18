-- Migration: 0008_create_documents.sql
-- Purpose: Document storage metadata and append-only event log
-- Source: DevPlan v1.0 Section 4.3.3, PRD Section 4.1.2

-- Document metadata — one row per uploaded file
-- Actual files live in Supabase Storage (private bucket); access via signed URL only
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  document_type   TEXT NOT NULL
                    CHECK (document_type IN (
                      'passport', 'national_id', 'residence_permit', 'driving_licence',
                      'proof_of_address', 'bank_statement', 'utility_bill', 'other'
                    )),
  storage_path    TEXT NOT NULL,  -- Supabase Storage object path (bucket-relative)
  file_name       TEXT NOT NULL,
  file_size       BIGINT,         -- bytes
  mime_type       TEXT,
  file_hash       TEXT,           -- SHA-256 hex digest (populated by compute-document-hash edge function)
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected', 'expired')),
  uploaded_by     UUID REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS documents_customer_id_idx ON documents (customer_id);
CREATE INDEX IF NOT EXISTS documents_tenant_id_idx ON documents (tenant_id);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents (tenant_id, status);


-- Append-only document event log
-- Captures: uploaded, verified, rejected, expired, accessed, hash_computed
CREATE TABLE IF NOT EXISTS document_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  event_type    TEXT NOT NULL,
  actor_id      UUID REFERENCES users(id),
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

-- Append-only guard
CREATE OR REPLACE FUNCTION prevent_document_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'document_events is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_document_event_update
  BEFORE UPDATE ON document_events
  FOR EACH ROW EXECUTE FUNCTION prevent_document_event_modification();

CREATE TRIGGER no_document_event_delete
  BEFORE DELETE ON document_events
  FOR EACH ROW EXECUTE FUNCTION prevent_document_event_modification();

CREATE INDEX IF NOT EXISTS document_events_document_id_idx ON document_events (document_id);
CREATE INDEX IF NOT EXISTS document_events_tenant_id_idx ON document_events (tenant_id);
