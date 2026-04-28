-- pgTAP test: documents + document_events — RLS + append-only events
-- Source: migration 0008

BEGIN;
SELECT plan(5);

SELECT has_table_privilege(
  'authenticated', 'documents', 'SELECT',
  'authenticated has SELECT on documents'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'documents'),
  'documents has RLS enabled'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'document_events', 'DELETE'),
  'authenticated does NOT have DELETE on document_events'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_document_event_update'
       AND tgrelid = 'public.document_events'::regclass
  ),
  'no_document_event_update trigger present'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_document_event_delete'
       AND tgrelid = 'public.document_events'::regclass
  ),
  'no_document_event_delete trigger present'
);

SELECT * FROM finish();
ROLLBACK;
