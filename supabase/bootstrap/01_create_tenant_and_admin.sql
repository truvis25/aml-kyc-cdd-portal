-- ============================================================
-- Production Bootstrap: Create first tenant + admin user
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Run each step separately and follow the instructions.
-- ============================================================

-- ─── STEP 1: Create your tenant ──────────────────────────────
-- Run this block and copy the returned ID.

INSERT INTO tenants (id, slug, name, status, settings)
VALUES (
  extensions.gen_random_uuid(),
  'truvis',                          -- URL slug: /{slug}/onboard
  'TruVis',                          -- Display name
  'active',
  '{
    "active_modules": ["m01", "m02", "m07", "m08", "m09", "m10", "m11", "m12", "m13"],
    "primary_jurisdiction": "UAE",
    "branding": {
      "company_name": "TruVis",
      "primary_color": "#1a56db"
    }
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, slug, name;

-- !! Save the tenant ID from the output above !!


-- ─── STEP 2: Create your auth user ───────────────────────────
-- Do this in the Supabase Dashboard (NOT in SQL):
--   Authentication → Users → Add user
--   Enter your email address and a strong password.
--   Copy the UUID shown in the users list after creation.


-- ─── STEP 3: Provision as tenant_admin ───────────────────────
-- Replace both UUIDs below with your real values, then run.

SELECT provision_admin_user(
  'PASTE-YOUR-AUTH-USER-UUID-HERE',   -- from Dashboard → Authentication → Users
  'PASTE-YOUR-TENANT-ID-HERE',        -- from Step 1 output
  'Your Full Name'                    -- display name shown in the platform
);

-- Expected output: {"success": true, "message": "User provisioned as tenant_admin..."}
-- If you see an error, check that:
--   1. The auth user UUID matches exactly what's in Dashboard → Authentication → Users
--   2. The tenant ID matches the one returned in Step 1
--   3. Migration 0020 has been applied (run: supabase db push)


-- ─── STEP 4: Verify ──────────────────────────────────────────
-- Confirm the setup is complete:

SELECT
  u.id,
  u.display_name,
  t.slug AS tenant_slug,
  r.name AS role
FROM users u
JOIN user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
JOIN roles r ON r.id = ur.role_id
JOIN tenants t ON t.id = u.tenant_id;

-- You should see one row with your name and role = 'tenant_admin'
-- You can now sign in at /sign-in and will land on /dashboard


-- ─── STEP 5: Onboarding URL ──────────────────────────────────
-- Your customer onboarding URL will be:
--   https://your-domain.com/truvis/onboard
--
-- Customers start there, select Individual or Business,
-- then proceed through the KYC/KYB flow.
