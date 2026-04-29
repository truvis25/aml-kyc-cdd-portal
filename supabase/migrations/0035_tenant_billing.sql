-- Migration: 0035_tenant_billing.sql
-- Purpose: Tenant billing and subscription state for Nomod payment integration
-- References: Week 3-4 Signup + Billing (Item 1)

CREATE TABLE IF NOT EXISTS tenant_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant_billing ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tenant_billing_tenant_id_idx ON tenant_billing (tenant_id);
CREATE INDEX IF NOT EXISTS tenant_billing_status_idx ON tenant_billing (status);

-- RLS: Tenants can only read their own billing
CREATE POLICY "tenant_billing_tenant_read"
  ON tenant_billing FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Store payment links created via Nomod
CREATE TABLE IF NOT EXISTS tenant_billing_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nomod_link_id text NOT NULL UNIQUE, -- Nomod's ID for the payment link
  nomod_link_url text NOT NULL,
  nomod_payment_id text, -- Set when payment is received
  plan text NOT NULL CHECK (plan IN ('starter', 'growth')),
  amount_aed numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'paid', 'failed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE tenant_billing_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tenant_billing_links_tenant_id_idx ON tenant_billing_links (tenant_id);
CREATE INDEX IF NOT EXISTS tenant_billing_links_nomod_link_id_idx ON tenant_billing_links (nomod_link_id);

-- RLS: Tenants can only read their own links
CREATE POLICY "tenant_billing_links_tenant_read"
  ON tenant_billing_links FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Track payment-related events
CREATE TABLE IF NOT EXISTS billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'payment.completed', 'subscription.started', 'invoice.failed', etc.
  nomod_event_id text, -- Nomod's webhook event ID if applicable
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS billing_events_tenant_id_idx ON billing_events (tenant_id);
CREATE INDEX IF NOT EXISTS billing_events_event_type_idx ON billing_events (event_type);

-- RLS: Tenants can only read their own events
CREATE POLICY "billing_events_tenant_read"
  ON billing_events FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
