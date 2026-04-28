-- Migration: 0028_webhook_retry_support.sql
-- Purpose: Add retry scheduling, atomic claim, and dead-letter handling to the
--          webhook_events queue created in 0013. Backstops the consumer side
--          (Edge Functions in supabase/functions/) so events that arrive at
--          /api/webhooks/idv and /api/webhooks/screening are reliably drained.
-- Source: DevPlan v1.0 §4.5 (webhook reliability), PRD §4.2

-- 1. Schedule column for exponential-backoff retries.
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- 2. Index used by retry sweeps. Partial — only rows that may be picked up.
DROP INDEX IF EXISTS webhook_events_status_idx;
CREATE INDEX IF NOT EXISTS webhook_events_pending_idx
  ON webhook_events (provider, received_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS webhook_events_retry_due_idx
  ON webhook_events (provider, next_retry_at)
  WHERE status = 'failed';

-- 3. Atomic claim — Edge Functions call this to pick exactly one event without
--    racing other workers. Combines `pending` events with `failed` events whose
--    backoff has elapsed. SKIP LOCKED guarantees concurrent invocations don't
--    fight over the same row.
CREATE OR REPLACE FUNCTION claim_pending_webhook_event(p_provider TEXT)
RETURNS webhook_events
LANGUAGE plpgsql
AS $$
DECLARE
  v_row webhook_events;
BEGIN
  WITH next_event AS (
    SELECT id
      FROM webhook_events
     WHERE provider = p_provider
       AND (
         status = 'pending'
         OR (status = 'failed' AND next_retry_at IS NOT NULL AND next_retry_at <= now())
       )
     ORDER BY received_at
     LIMIT 1
     FOR UPDATE SKIP LOCKED
  )
  UPDATE webhook_events w
     SET status   = 'processing',
         attempts = w.attempts + 1
    FROM next_event
   WHERE w.id = next_event.id
   RETURNING w.* INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_pending_webhook_event(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION claim_pending_webhook_event(TEXT) TO service_role;

-- 4. Mark-processed helper. Idempotent: re-marking a processed row is a no-op.
CREATE OR REPLACE FUNCTION mark_webhook_event_processed(p_event_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE webhook_events
     SET status       = 'processed',
         processed_at = now(),
         last_error   = NULL,
         next_retry_at = NULL
   WHERE id = p_event_id;
$$;

REVOKE EXECUTE ON FUNCTION mark_webhook_event_processed(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION mark_webhook_event_processed(UUID) TO service_role;

-- 5. Mark-failed helper. Computes exponential backoff (60s, 5m, 25m, 2h, 10h)
--    and promotes to dead_letter after 5 attempts. The processor keeps owning
--    the retry decision; this function just records it.
CREATE OR REPLACE FUNCTION mark_webhook_event_failed(
  p_event_id   UUID,
  p_error      TEXT,
  p_max_attempts INT DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempts INT;
  v_delay_seconds INT;
BEGIN
  SELECT attempts INTO v_attempts FROM webhook_events WHERE id = p_event_id;

  IF v_attempts >= p_max_attempts THEN
    UPDATE webhook_events
       SET status        = 'dead_letter',
           last_error    = p_error,
           next_retry_at = NULL
     WHERE id = p_event_id;
    RETURN;
  END IF;

  -- 60s * 5^(attempts-1): 60s, 5m, 25m, ~2h, ~10h
  v_delay_seconds := 60 * power(5, GREATEST(v_attempts - 1, 0))::INT;

  UPDATE webhook_events
     SET status        = 'failed',
         last_error    = p_error,
         next_retry_at = now() + make_interval(secs => v_delay_seconds)
   WHERE id = p_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION mark_webhook_event_failed(UUID, TEXT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION mark_webhook_event_failed(UUID, TEXT, INT) TO service_role;

-- 6. RLS: SELECT for admins is in 0016. Service role bypasses RLS so Edge
--    Functions can claim, update, and read without policies. We do NOT add
--    INSERT/UPDATE policies for authenticated roles — webhook ingestion runs
--    via the service-role client only.

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron + pg_net schedule (manual post-deploy step — env-specific)
--
-- Run the following AFTER deploying Edge Functions, replacing the project ref
-- and service role JWT. Both values live in the Supabase Dashboard.
--
--   SELECT cron.schedule(
--     'retry-failed-webhooks-hourly',
--     '0 * * * *',
--     $$ SELECT net.http_post(
--          url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/retry-failed-webhooks',
--          headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>')
--        ) $$
--   );
--
-- This file does NOT register the schedule itself, because the URL and JWT
-- vary per environment and committing them would leak credentials. CLAUDE.md
-- documents this as a deployment step.
-- ─────────────────────────────────────────────────────────────────────────────
