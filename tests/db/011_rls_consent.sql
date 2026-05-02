-- pgTAP test: consent_records — append-only consent capture
-- Source: migration 0009

BEGIN;
SELECT plan(4);

SELECT ok(
  has_table_privilege('authenticated', 'consent_records', 'INSERT'),
  'authenticated has INSERT on consent_records'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'consent_records'
       AND cmd IN ('UPDATE', 'ALL')
  ),
  'authenticated does NOT have UPDATE on consent_records (append-only)'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'consent_records'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on consent_records (append-only)'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'consent_records'),
  'consent_records has RLS enabled'
);

SELECT * FROM finish();
ROLLBACK;
