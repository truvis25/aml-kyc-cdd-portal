-- pgTAP test: risk_assessments — immutable history
-- Source: migration 0014

BEGIN;
SELECT plan(4);

SELECT has_table_privilege(
  'authenticated', 'risk_assessments', 'SELECT',
  'authenticated has SELECT on risk_assessments'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_risk_update'
       AND tgrelid = 'public.risk_assessments'::regclass
  ),
  'no_risk_update trigger blocks UPDATE'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_risk_delete'
       AND tgrelid = 'public.risk_assessments'::regclass
  ),
  'no_risk_delete trigger blocks DELETE'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'risk_assessments_latest_idx'),
  'risk_assessments_latest_idx exists for hot lookups'
);

SELECT * FROM finish();
ROLLBACK;
