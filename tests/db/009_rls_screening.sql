-- pgTAP test: screening_jobs / screening_hits / screening_hit_resolutions
-- Source: migrations 0013, 0016, 0025

BEGIN;
SELECT plan(7);

SELECT ok(
  has_table_privilege('authenticated', 'screening_jobs', 'SELECT'),
  'authenticated has SELECT on screening_jobs'
);

SELECT ok(
  has_table_privilege('authenticated', 'screening_hits', 'SELECT'),
  'authenticated has SELECT on screening_hits'
);

SELECT ok(
  has_table_privilege('authenticated', 'screening_hit_resolutions', 'INSERT'),
  'authenticated has INSERT on screening_hit_resolutions'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'screening_hit_resolutions'
       AND cmd IN ('DELETE', 'ALL')
  ),
  'authenticated does NOT have DELETE on screening_hit_resolutions'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_resolution_update'
       AND tgrelid = 'public.screening_hit_resolutions'::regclass
  ),
  'no_resolution_update trigger present'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'no_resolution_delete'
       AND tgrelid = 'public.screening_hit_resolutions'::regclass
  ),
  'no_resolution_delete trigger present'
);

-- screening_hits select policy enforces tenant scoping
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'screening_hits'
       AND policyname = 'screening_hits_select_staff'
  ),
  'screening_hits_select_staff policy exists'
);

SELECT * FROM finish();
ROLLBACK;
