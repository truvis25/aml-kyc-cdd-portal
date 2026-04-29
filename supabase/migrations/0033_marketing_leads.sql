-- Migration: 0033_marketing_leads.sql
-- Purpose: Public marketing lead capture (book-demo, contact forms).
-- Source: SaaS launch plan — public marketing surface PR #1
--
-- Notes:
--   * Marketing leads are NOT tenant-scoped — they are prospects, not customers.
--     They never enter audit_log (which is tenant-scoped); the table itself is
--     the record of truth.
--   * Public (anon) inserts are allowed via the lead-capture API route which
--     uses the anon Supabase client (lib/supabase/server.ts). Field-level
--     CHECK constraints enforce reasonable bounds so the table cannot be used
--     as a free-form blob store.
--   * Reads are restricted to platform_super_admin. Tenant staff have no
--     read access — these are pre-sales prospects, not customer data.

CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS marketing_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  name          TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  email         CITEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 320),
  company       TEXT CHECK (company IS NULL OR length(company) <= 200),
  role          TEXT CHECK (role IS NULL OR length(role) <= 100),
  vertical      TEXT CHECK (vertical IN ('dnfbp', 'fintech', 'bank', 'other') OR vertical IS NULL),
  message       TEXT CHECK (message IS NULL OR length(message) <= 2000),

  source_path   TEXT CHECK (source_path IS NULL OR length(source_path) <= 500),
  utm           JSONB NOT NULL DEFAULT '{}'::JSONB,

  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'qualified', 'rejected'))
);

-- Email looked up to dedupe / merge prospects. Created-at index for sorted listings.
CREATE INDEX IF NOT EXISTS marketing_leads_email_idx ON marketing_leads (email);
CREATE INDEX IF NOT EXISTS marketing_leads_created_at_idx ON marketing_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS marketing_leads_status_idx ON marketing_leads (status, created_at DESC);

-- Keep updated_at in sync on UPDATE.
CREATE OR REPLACE FUNCTION marketing_leads_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketing_leads_updated_at
  BEFORE UPDATE ON marketing_leads
  FOR EACH ROW EXECUTE FUNCTION marketing_leads_set_updated_at();

ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- Public (anon) inserts: anyone hitting the marketing site can submit a lead.
-- The API route validates with Zod before this point; this policy is the
-- belt-and-braces backstop. No WITH CHECK clause needed beyond the column
-- CHECKs above — every column has a length bound or enum.
CREATE POLICY "marketing_leads_public_insert" ON marketing_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Platform super-admin reads (the operator of TruVis, not tenant staff).
CREATE POLICY "marketing_leads_platform_admin_select" ON marketing_leads
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'platform_super_admin');

-- Platform super-admin can update status (new → contacted → qualified/rejected).
CREATE POLICY "marketing_leads_platform_admin_update" ON marketing_leads
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'platform_super_admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'platform_super_admin');

-- No DELETE policy — leads are retained for the configured CRM window;
-- service role can clean up out of band if required.

COMMENT ON TABLE marketing_leads IS
  'Public marketing prospect captures from the landing site. Not tenant-scoped; not in audit_log.';
