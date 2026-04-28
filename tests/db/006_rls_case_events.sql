-- pgTAP test: case_events — append-only enforcement
-- Source: migration 0015

BEGIN;
SELECT plan(5);

SELECT has_table_privilege(
  'authenticated', 'case_events', 'INSERT',
  'authenticated has INSERT on case_events'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'case_events', 'DELETE'),
  'authenticated does NOT have DELETE on case_events'
);

-- Trigger blocks UPDATE on case_events (append-only).
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_case_event_update'
       AND tgrelid = 'public.case_events'::regclass
  ),
  'no_case_event_update trigger present'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_case_event_delete'
       AND tgrelid = 'public.case_events'::regclass
  ),
  'no_case_event_delete trigger present'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'case_events'),
  'case_events has RLS enabled'
);

SELECT * FROM finish();
ROLLBACK;
