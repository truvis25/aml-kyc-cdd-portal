-- Migration: 0013_create_screening.sql
-- Purpose: AML screening jobs, hits, resolutions, and webhook queue
-- Source: DevPlan v1.0 Section 4.5, PRD Section 4.2

-- Webhook event queue — inbound webhooks from IDV/screening providers land here first.
-- Edge Functions process them asynchronously. Ensures no data loss on transient failures.
CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  provider        TEXT NOT NULL,  -- 'sumsub' | 'complyadvantage'
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  signature       TEXT,           -- raw signature header for verification
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'dead_letter')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON webhook_events (status, received_at) WHERE status = 'pending';


-- AML screening jobs — one job per screening request
CREATE TABLE IF NOT EXISTS screening_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  customer_id       UUID NOT NULL REFERENCES customers(id),
  provider          TEXT NOT NULL DEFAULT 'complyadvantage',
  external_job_id   TEXT,         -- provider's reference
  search_type       TEXT NOT NULL DEFAULT 'individual'
                      CHECK (search_type IN ('individual', 'corporate')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  requested_by      UUID REFERENCES users(id),
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

ALTER TABLE screening_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS screening_jobs_customer_id_idx ON screening_jobs (customer_id);
CREATE INDEX IF NOT EXISTS screening_jobs_tenant_id_idx ON screening_jobs (tenant_id);


-- Screening hits — individual matches returned by the screening provider
CREATE TABLE IF NOT EXISTS screening_hits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  job_id          UUID NOT NULL REFERENCES screening_jobs(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  hit_type        TEXT NOT NULL,  -- 'pep', 'sanction', 'adverse_media', 'watchlist'
  match_name      TEXT NOT NULL,
  match_score     NUMERIC(5,2),   -- provider confidence score 0-100
  raw_data        JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed_match', 'false_positive', 'escalated')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE screening_hits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS screening_hits_job_id_idx ON screening_hits (job_id);
CREATE INDEX IF NOT EXISTS screening_hits_customer_id_idx ON screening_hits (customer_id);


-- Screening hit resolutions — append-only analyst decisions on hits
CREATE TABLE IF NOT EXISTS screening_hit_resolutions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  hit_id          UUID NOT NULL REFERENCES screening_hits(id),
  resolution      TEXT NOT NULL CHECK (resolution IN ('confirmed_match', 'false_positive', 'escalated')),
  rationale       TEXT NOT NULL,
  resolved_by     UUID NOT NULL REFERENCES users(id),
  resolved_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE screening_hit_resolutions ENABLE ROW LEVEL SECURITY;

-- Append-only guard
CREATE OR REPLACE FUNCTION prevent_resolution_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'screening_hit_resolutions is append-only: % on row % is not permitted', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_resolution_update
  BEFORE UPDATE ON screening_hit_resolutions
  FOR EACH ROW EXECUTE FUNCTION prevent_resolution_modification();

CREATE TRIGGER no_resolution_delete
  BEFORE DELETE ON screening_hit_resolutions
  FOR EACH ROW EXECUTE FUNCTION prevent_resolution_modification();

CREATE INDEX IF NOT EXISTS screening_hit_resolutions_hit_id_idx ON screening_hit_resolutions (hit_id);
