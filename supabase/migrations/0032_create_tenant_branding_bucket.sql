-- Migration: 0032_create_tenant_branding_bucket.sql
-- Purpose: Public storage bucket for tenant branding (logos). Logo URLs are
--          rendered on the customer-facing onboarding pages so they need to
--          be publicly readable; uploads are still restricted to tenant_admin.
--          Keys live under `{tenant_id}/logo.{ext}`.
-- Source: Sprint D — branding upload follow-up to tenant_config (0030)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  true,                                              -- publicly readable
  524288,                                            -- 512 KB cap
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public read is implicit on a public bucket; no SELECT policy required.

-- Upload is restricted to tenant_admin / platform_super_admin. The first path
-- component must equal the JWT tenant_id so a tenant cannot overwrite another
-- tenant's logo.
DROP POLICY IF EXISTS "tenant_branding_upload" ON storage.objects;
CREATE POLICY "tenant_branding_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-branding'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
  );

-- Replacement (overwrite via upsert) requires UPDATE on the same path.
DROP POLICY IF EXISTS "tenant_branding_update" ON storage.objects;
CREATE POLICY "tenant_branding_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-branding'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  )
  WITH CHECK (
    bucket_id = 'tenant-branding'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
  );

-- Logo replacement is the only delete; same gate.
DROP POLICY IF EXISTS "tenant_branding_delete" ON storage.objects;
CREATE POLICY "tenant_branding_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-branding'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('tenant_admin', 'platform_super_admin')
  );
