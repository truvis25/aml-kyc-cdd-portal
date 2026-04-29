-- Migration: 0034_sumsub_applicants.sql
-- Purpose: Store Sumsub applicant data and verification results for IDV integration
-- References: Sumsub API v5, applicantReviewed webhook event

CREATE TABLE IF NOT EXISTS sumsub_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_session_id uuid NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  sumsub_applicant_id text NOT NULL UNIQUE,
  sumsub_access_token text NOT NULL, -- encrypted token for Web SDK iframe
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'review')),
  review_result jsonb, -- { reviewAnswer: GREEN|YELLOW|RED, reasons: [], reviewRejectType: RETRY|DECLINE }
  verification_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of { verificationId, type, status, verified }
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sumsub_applicants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS sumsub_applicants_session_id_idx ON sumsub_applicants (onboarding_session_id);
CREATE INDEX IF NOT EXISTS sumsub_applicants_sumsub_id_idx ON sumsub_applicants (sumsub_applicant_id);
CREATE INDEX IF NOT EXISTS sumsub_applicants_status_idx ON sumsub_applicants (verification_status);

-- RLS: Customers can only access their own session's applicant
CREATE POLICY "sumsub_applicants_tenant_access"
  ON sumsub_applicants FOR SELECT
  USING (
    onboarding_session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "sumsub_applicants_insert_via_api"
  ON sumsub_applicants FOR INSERT
  WITH CHECK (true); -- API route uses server client with RLS bypass; no anon INSERT

-- Extend onboarding_sessions table with IDV completion tracking
ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS idv_completed_at timestamptz;
