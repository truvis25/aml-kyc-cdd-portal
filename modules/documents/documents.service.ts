import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import {
  createDocumentRecord,
  createSignedUploadUrl,
  createSignedDownloadUrl,
  appendDocumentEvent,
  updateDocumentStatus,
  updateDocumentStoragePath,
  getDocumentById,
  buildStoragePath,
} from './documents.repository';
import type { Document, SignedUploadUrl, SignedDownloadUrl } from './documents.types';
import type { UploadUrlRequest } from '@/lib/validations/documents';

export async function initiateUpload(
  params: UploadUrlRequest,
  tenant_id: string,
  actor_id: string
): Promise<SignedUploadUrl> {
  const doc = await createDocumentRecord({
    tenant_id,
    customer_id: params.customer_id,
    document_type: params.document_type,
    storage_path: `${tenant_id}/${params.customer_id}/pending`,
    file_name: params.file_name,
    file_size: params.file_size,
    mime_type: params.mime_type,
    uploaded_by: actor_id,
  });

  const storage_path = buildStoragePath(tenant_id, params.customer_id, doc.id, params.file_name);
  await updateDocumentStoragePath(doc.id, tenant_id, storage_path);
  const upload_url = await createSignedUploadUrl(storage_path);

  await appendDocumentEvent(doc.id, tenant_id, 'upload_initiated', actor_id, {
    document_type: params.document_type,
    file_name: params.file_name,
  });

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.DOCUMENT_UPLOADED,
    entity_type: AuditEntityType.DOCUMENT,
    entity_id: doc.id,
    actor_id,
    payload: { document_type: params.document_type, customer_id: params.customer_id, phase: 'initiated' },
  });

  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  return { document_id: doc.id, upload_url, storage_path, expires_at };
}

export async function confirmUpload(
  document_id: string,
  tenant_id: string,
  actor_id: string
): Promise<Document> {
  const doc = await getDocumentById(document_id, tenant_id);
  if (!doc) throw new Error('Document not found');

  await updateDocumentStatus(document_id, tenant_id, 'uploaded');
  await appendDocumentEvent(document_id, tenant_id, 'uploaded', actor_id, {});

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.DOCUMENT_UPLOADED,
    entity_type: AuditEntityType.DOCUMENT,
    entity_id: document_id,
    actor_id,
    payload: { customer_id: doc.customer_id, document_type: doc.document_type },
  });

  // Fire the hash compute Edge Function. We don't await — the user shouldn't
  // wait on a Storage download to finish their request. The function is
  // idempotent so a retry is cheap, and a missed invocation just leaves
  // file_hash null until a future batch run picks it up.
  void invokeComputeDocumentHash(document_id, tenant_id);

  return { ...doc, status: 'uploaded' };
}

async function invokeComputeDocumentHash(
  document_id: string,
  tenant_id: string,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.warn('[documents] compute-document-hash skipped: env not configured');
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(`${supabaseUrl}/functions/v1/compute-document-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ document_id, tenant_id }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    // Don't bubble — hash compute is a background concern.
    console.warn('[documents] compute-document-hash invoke failed:', err instanceof Error ? err.message : err);
  }
}

export async function getDocumentWithUrl(
  document_id: string,
  tenant_id: string,
  actor_id: string
): Promise<{ document: Document; download_url: SignedDownloadUrl }> {
  const doc = await getDocumentById(document_id, tenant_id);
  if (!doc) throw new Error('Document not found');

  const url = await createSignedDownloadUrl(doc.storage_path);
  await appendDocumentEvent(document_id, tenant_id, 'accessed', actor_id, {});

  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  return {
    document: doc,
    download_url: { document_id, download_url: url, expires_at },
  };
}
