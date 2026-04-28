-- pgTAP test: notification_events — append-only, no PII at rest
-- Source: migration 0029

BEGIN;
SELECT plan(5);

SELECT has_table_privilege(
  'authenticated', 'notification_events', 'INSERT',
  'authenticated has INSERT on notification_events'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'notification_events', 'DELETE'),
  'authenticated does NOT have DELETE on notification_events'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_notification_event_update'
       AND tgrelid = 'public.notification_events'::regclass
  ),
  'no_notification_event_update trigger present'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_notification_event_delete'
       AND tgrelid = 'public.notification_events'::regclass
  ),
  'no_notification_event_delete trigger present'
);

-- Recipient PII rule: schema must store recipient_hash, never raw email.
-- Verify the column is named recipient_hash and is NOT NULL.
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'notification_events'
       AND column_name = 'recipient_hash'
       AND is_nullable = 'NO'
  ),
  'notification_events.recipient_hash exists and is NOT NULL'
);

SELECT * FROM finish();
ROLLBACK;
