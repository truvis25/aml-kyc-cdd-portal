-- Seed: roles.sql
-- Platform role definitions — seeded on initialization
-- Source: DevPlan v1.0 Section 4.2 RBAC Model
-- These roles are platform-defined and cannot be created or deleted by tenants.

INSERT INTO roles (name, description) VALUES
  ('platform_super_admin', 'Cross-tenant platform operator. Read-only access to tenant config. Cannot read customer PII. Cannot make compliance decisions.'),
  ('tenant_admin',         'Single-tenant administrator. Manages users and workflow configuration. Cannot make MLRO-level compliance decisions.'),
  ('mlro',                 'MLRO / Compliance Officer. Full case access including EDD and SAR. Highest data access. All actions logged at field level.'),
  ('senior_reviewer',      'Senior Reviewer. Assigned case review. EDD case review. Cannot see SAR case status.'),
  ('analyst',              'Analyst (Reviewer). Assigned cases only. Cannot approve high-risk cases without second reviewer.'),
  ('onboarding_agent',     'Onboarding Agent. Initiates and assists with onboarding. Cannot see EDD data. Cannot make compliance decisions.'),
  ('read_only',            'Read-Only / Reporting. Aggregate and anonymised reports only. No individual customer PII. No case detail access.')
ON CONFLICT (name) DO NOTHING;
