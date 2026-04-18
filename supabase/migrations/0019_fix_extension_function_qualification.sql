-- Migration: 0019_fix_extension_function_qualification.sql
-- Purpose:
--   1) Ensure pgcrypto/uuid-ossp are available from the `extensions` schema
--   2) Remove search_path dependence for extension-backed runtime calls
--   3) Fix audit row hash trigger function runtime failure in Supabase

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
DECLARE
  v_pgcrypto_schema text;
  v_uuid_ossp_schema text;
BEGIN
  SELECT n.nspname
    INTO v_pgcrypto_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pgcrypto';

  IF v_pgcrypto_schema IS NULL THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
  ELSIF v_pgcrypto_schema <> 'extensions' THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;

  SELECT n.nspname
    INTO v_uuid_ossp_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'uuid-ossp';

  IF v_uuid_ossp_schema IS NULL THEN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
  ELSIF v_uuid_ossp_schema <> 'extensions' THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION compute_audit_row_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
  NEW.row_hash = encode(
    extensions.digest(
      NEW.tenant_id::TEXT ||
      NEW.event_time::TEXT ||
      NEW.event_type ||
      NEW.entity_type ||
      NEW.entity_id::TEXT ||
      NEW.payload::TEXT,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

ALTER TABLE tenants ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE roles ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE audit_log ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE customers ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE customer_data_versions ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE documents ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE document_events ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE consent_records ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE onboarding_sessions ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE workflow_definitions ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE webhook_events ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE screening_jobs ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE screening_hits ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE screening_hit_resolutions ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE risk_assessments ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE cases ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE case_events ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
ALTER TABLE approvals ALTER COLUMN id SET DEFAULT extensions.gen_random_uuid();
