-- pgTAP test: webhook_events queue + claim_pending_webhook_event helper
-- Source: migrations 0013, 0028

BEGIN;
SELECT plan(4);

-- The webhook_events table is service-role-only at the application layer;
-- authenticated users (other than admins) should not be able to see queue
-- contents.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'webhook_events'
       AND policyname = 'webhook_events_select_admin'
  ),
  'webhook_events_select_admin policy exists'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'webhook_events'),
  'webhook_events has RLS enabled'
);

-- Atomic claim function exists (added in 0028).
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_proc
     WHERE proname = 'claim_pending_webhook_event'
  ),
  'claim_pending_webhook_event() function exists'
);

-- Required column for retry scheduling.
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'webhook_events'
       AND column_name = 'next_retry_at'
  ),
  'webhook_events.next_retry_at column exists'
);

SELECT * FROM finish();
ROLLBACK;
