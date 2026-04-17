-- Seed: test-tenant.sql
-- Creates a test tenant and test users for local development.
-- DO NOT run in production — this seed is for local development only.
-- Source: DevPlan v1.0 Section 3.2

-- Test tenant
INSERT INTO tenants (id, slug, name, status, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'truvis-test',
  'TruVis Test Tenant',
  'active',
  '{
    "active_modules": ["m01", "m02", "m07", "m08", "m09", "m10", "m11", "m12", "m13"],
    "primary_jurisdiction": "UAE",
    "branding": {
      "company_name": "TruVis Test",
      "primary_color": "#1a56db"
    }
  }'
)
ON CONFLICT (id) DO NOTHING;
