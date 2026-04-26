-- Migration: 0023_create_kyc_documents_bucket.sql
-- Creates the private kyc-documents storage bucket and RLS policies so that
-- authenticated staff can generate signed upload URLs and read documents within
-- their own tenant's folder tree: {tenant_id}/{customer_id}/{document_id}.{ext}

-- ============================================================
-- Create the bucket (private — no public access)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  20971520,   -- 20 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies on storage.objects
-- Path format: {tenant_id}/{customer_id}/{document_id}.{ext}
-- The first path component is always tenant_id.
-- ============================================================

-- Allow authenticated staff to upload (creates signed upload URL + stores object)
CREATE POLICY "kyc_docs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Allow authenticated staff to read objects within their tenant
CREATE POLICY "kyc_docs_tenant_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Allow authenticated staff to delete objects within their tenant (for replacements)
CREATE POLICY "kyc_docs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );
