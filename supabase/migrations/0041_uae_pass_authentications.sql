-- Migration: 0041_uae_pass_authentications.sql
-- Purpose: Persistence for the UAE Pass national digital identity bridge
--          (OIDC). One row per "Sign in with UAE Pass" attempt that the
--          customer initiates from the onboarding identity step.
-- Source:  FINAL_LAUNCH_PLAN.md §2.2 + Sprint 2 backlog item S2-01.
--
-- Lifecycle:
--   initiated  → row created when the customer clicks the button. We persist
--                the OIDC state, nonce, and PKCE code_verifier so the callback
--                can replay them when the IdP redirects the browser back.
--   succeeded  → callback exchanged the code, validated the ID token, and
--                fetched userinfo. `subject`, `user_type`, and `claims` are
--                populated. `claims` is JSONB because the UAE Pass profile
--                shape evolves (additional locale-specific name fields,
--                titles, etc.) and we want the audit-grade record to capture
--                whatever the IdP sent.
--   failed     → any callback path that didn't yield a usable identity:
--                state mismatch, IdP error, token-exchange failure, signature
--                verification failure, assurance-level too low for tenant
--                policy. `error_code` + `error_detail` capture the reason.
--   expired    → not yet automated; reserved for a future cron sweep that
--                marks rows older than the OIDC code-exchange window stale.
--
-- Trust model:
--   - state is a 256-bit cryptographically random token. The callback locates
--     the row by state alone, then matches the JWT `nonce` claim against the
--     stored nonce. CSRF is defeated by the state binding; replay is defeated
--     by the nonce.
--   - claims contains PII (Emirates ID, full name, DOB, mobile, email). RLS
--     limits read access to the originating tenant. The onboarding identity
--     form pre-fills from the most-recent succeeded row for the session.

CREATE TABLE IF NOT EXISTS uae_pass_authentications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  onboarding_session_id       UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,

  -- OIDC round-trip protection
  state                       TEXT NOT NULL UNIQUE
                                CHECK (length(state) BETWEEN 32 AND 256),
  nonce                       TEXT NOT NULL
                                CHECK (length(nonce) BETWEEN 32 AND 256),
  code_verifier               TEXT NOT NULL
                                CHECK (length(code_verifier) BETWEEN 43 AND 128),

  -- Tenant policy at the moment the flow was initiated. Captured here (not
  -- looked up at callback time) so a config change mid-flight cannot retro-
  -- actively reject an in-progress authentication.
  required_assurance_level    TEXT NOT NULL DEFAULT 'SOP3'
                                CHECK (required_assurance_level IN ('SOP2', 'SOP3')),

  status                      TEXT NOT NULL DEFAULT 'initiated'
                                CHECK (status IN ('initiated', 'succeeded', 'failed', 'expired')),

  -- Populated on success
  subject                     TEXT,             -- UAE Pass `sub` (stable user UUID)
  user_type                   TEXT
                                CHECK (user_type IS NULL
                                       OR user_type IN ('SOP1', 'SOP2', 'SOP3', 'VISITOR')),
  claims                      JSONB,            -- full userinfo payload (PII)

  -- Populated on failure
  error_code                  TEXT
                                CHECK (error_code IS NULL OR length(error_code) <= 100),
  error_detail                TEXT
                                CHECK (error_detail IS NULL OR length(error_detail) <= 2000),

  initiated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                TIMESTAMPTZ,

  -- Lifecycle invariant: terminal statuses must carry a completed_at.
  CONSTRAINT uae_pass_status_completion_consistent CHECK (
    (status = 'initiated' AND completed_at IS NULL)
    OR (status IN ('succeeded', 'failed', 'expired') AND completed_at IS NOT NULL)
  ),
  -- A succeeded row must carry a subject + user_type + claims.
  CONSTRAINT uae_pass_succeeded_has_identity CHECK (
    status <> 'succeeded'
    OR (subject IS NOT NULL AND user_type IS NOT NULL AND claims IS NOT NULL)
  )
);

ALTER TABLE uae_pass_authentications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS uae_pass_authentications_session_idx
  ON uae_pass_authentications (onboarding_session_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS uae_pass_authentications_state_idx
  ON uae_pass_authentications (state);
CREATE INDEX IF NOT EXISTS uae_pass_authentications_tenant_status_idx
  ON uae_pass_authentications (tenant_id, status, initiated_at DESC);

-- RLS: rows scoped to the originating tenant. The OIDC callback runs inside
-- the same browser as the authorize call, so the staff agent's JWT is still
-- present and the `tenant_id` claim matches.
CREATE POLICY "uae_pass_authentications_tenant_select"
  ON uae_pass_authentications FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "uae_pass_authentications_tenant_insert"
  ON uae_pass_authentications FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "uae_pass_authentications_tenant_update"
  ON uae_pass_authentications FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

COMMENT ON TABLE uae_pass_authentications IS
  'OIDC bridge state for UAE Pass national digital identity. One row per attempt. See FINAL_LAUNCH_PLAN.md §2.2.';
COMMENT ON COLUMN uae_pass_authentications.claims IS
  'Full UAE Pass userinfo payload (PII). RLS limits read access to the originating tenant.';
