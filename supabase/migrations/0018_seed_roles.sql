-- Migration: 0018_seed_roles.sql
-- Purpose: Seed the seven platform role definitions into public.roles.
--
-- Why this is a migration, not a seed file:
--   Roles are platform-defined constants required in EVERY environment
--   (local, staging, production). They must exist before any of the
--   following can work:
--     • user_roles rows (role_id → roles.id FK)
--     • provision_admin_user() bootstrap function (0006)
--     • custom_access_token_hook JWT enrichment (0005) — it JOINs
--       user_roles → roles to produce the role claim; an empty roles
--       table means no claim → every user is blocked at the proxy guard
--
--   Previously these rows lived only in supabase/seed/01_roles.sql,
--   which only ran during local `supabase db reset` AND only when a
--   seed.sql entry-point existed (it did not). Staging and production
--   therefore always had an empty public.roles table.
--
-- Idempotency:
--   ON CONFLICT (name) DO NOTHING — safe to re-run, safe on environments
--   where 01_roles.sql was applied manually.
--
-- Source: DevPlan v1.0 Section 4.2 RBAC Model
--         Mirrors: supabase/seed/01_roles.sql (kept for documentation)
--         Mirrors: custom_access_token_hook permission map (0005)
--         Mirrors: lib/constants/roles.ts Role enum

INSERT INTO roles (name, description) VALUES
  ('platform_super_admin', 'Cross-tenant platform operator. Read-only access to tenant config. Cannot read customer PII. Cannot make compliance decisions.'),
  ('tenant_admin',         'Single-tenant administrator. Manages users and workflow configuration. Cannot make MLRO-level compliance decisions.'),
  ('mlro',                 'MLRO / Compliance Officer. Full case access including EDD and SAR. Highest data access. All actions logged at field level.'),
  ('senior_reviewer',      'Senior Reviewer. Assigned case review. EDD case review. Cannot see SAR case status.'),
  ('analyst',              'Analyst (Reviewer). Assigned cases only. Cannot approve high-risk cases without second reviewer.'),
  ('onboarding_agent',     'Onboarding Agent. Initiates and assists with onboarding. Cannot see EDD data. Cannot make compliance decisions.'),
  ('read_only',            'Read-Only / Reporting. Aggregate and anonymised reports only. No individual customer PII. No case detail access.')
ON CONFLICT (name) DO NOTHING;
