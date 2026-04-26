import { createClient } from '@/lib/supabase/server';
import type { CreateDocumentParams, Document } from './documents.types';

const STORAGE_BUCKET = 'kyc-documents';
const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes — compliance requirement

export async function createDocumentRecord(params: CreateDocumentParams): Promise<Document> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      document_type: params.document_type,
      storage_path: params.storage_path,
      file_name: params.file_name,
      file_size: params.file_size ?? null,
      mime_type: params.mime_type ?? null,
      uploaded_by: params.uploaded_by ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create document record: ${error.message}`);
  return data as Document;
}

export async function getDocumentById(id: string, tenant_id: string): Promise<Document | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch document: ${error.message}`);
  return data as Document | null;
}

export async function getDocumentsByCustomer(
  customer_id: string,
  tenant_id: string
): Promise<Document[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .order('uploaded_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
  return (data ?? []) as Document[];
}

export async function createSignedUploadUrl(
  storage_path: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storage_path);

  if (error) throw new Error(`Failed to create upload URL: ${error.message}`);
  return data.signedUrl;
}

export async function createSignedDownloadUrl(
  storage_path: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storage_path, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(`Failed to create download URL: ${error.message}`);
  return data.signedUrl;
}

export async function appendDocumentEvent(
  document_id: string,
  tenant_id: string,
  event_type: string,
  actor_id: string | null,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('document_events').insert({
    document_id,
    tenant_id,
    event_type,
    actor_id,
    payload,
  });

  if (error) throw new Error(`Failed to append document event: ${error.message}`);
}

export async function updateDocumentStoragePath(
  id: string,
  tenant_id: string,
  storage_path: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('documents')
    .update({ storage_path })
    .eq('id', id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update document storage path: ${error.message}`);
}

export async function updateDocumentStatus(
  id: string,
  tenant_id: string,
  status: 'uploaded' | 'verified' | 'rejected' | 'expired'
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update document status: ${error.message}`);
}

export function buildStoragePath(tenant_id: string, customer_id: string, document_id: string, file_name: string): string {
  const ext = file_name.split('.').pop() ?? 'bin';
  return `${tenant_id}/${customer_id}/${document_id}.${ext}`;
}
