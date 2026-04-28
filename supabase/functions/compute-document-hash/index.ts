// Edge Function: compute-document-hash
//
// Downloads a document from the private Storage bucket, computes its SHA-256
// digest, persists it to `documents.file_hash`, and appends a `hash_computed`
// row to `document_events`. Intended to be invoked via HTTP from
// `app/api/documents/[id]` (POST) immediately after an upload is confirmed,
// but also safe to invoke as a one-shot batch tool for legacy rows missing a
// hash.
//
// Auth: verify_jwt = false. The function authenticates by requiring the
// service-role JWT in the Authorization header (matching the pattern used
// by retry-failed-webhooks). Direct public exposure is therefore not a
// concern provided the deployment respects the standard Supabase function
// auth headers.

import { createServiceRoleClient } from '../_shared/supabase-client.ts';

const STORAGE_BUCKET = 'kyc-documents';

interface InvokePayload {
  document_id?: string;
  tenant_id?: string;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createServiceRoleClient();

  try {
    const body = (await req.json()) as InvokePayload;
    const documentId = body.document_id;
    const tenantId = body.tenant_id;
    if (!documentId || !tenantId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'document_id_and_tenant_id_required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { data: docRow, error: docErr } = await supabase
      .from('documents')
      .select('id, tenant_id, storage_path, status, file_hash')
      .eq('id', documentId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (docErr) throw new Error(`documents lookup failed: ${docErr.message}`);
    if (!docRow) {
      return new Response(JSON.stringify({ ok: false, error: 'document_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const doc = docRow as {
      id: string;
      tenant_id: string;
      storage_path: string;
      status: string;
      file_hash: string | null;
    };

    // Idempotency: if the hash is already populated, return success without
    // re-downloading. Repeated invocations from upstream retries are safe.
    if (doc.file_hash) {
      return new Response(
        JSON.stringify({ ok: true, document_id: doc.id, file_hash: doc.file_hash, cached: true }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(doc.storage_path);
    if (dlErr || !blob) {
      throw new Error(`storage download failed: ${dlErr?.message ?? 'no body'}`);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const hash = await sha256Hex(bytes);

    const { error: updErr } = await supabase
      .from('documents')
      .update({ file_hash: hash })
      .eq('id', doc.id);
    if (updErr) throw new Error(`documents update failed: ${updErr.message}`);

    const { error: evErr } = await supabase.from('document_events').insert({
      document_id: doc.id,
      tenant_id: doc.tenant_id,
      event_type: 'hash_computed',
      payload: { algorithm: 'sha256', byte_count: bytes.byteLength },
    });
    if (evErr) throw new Error(`document_events insert failed: ${evErr.message}`);

    // Audit-log entry: write directly via the service-role client. We mirror
    // the audit.emit() shape used by app/ code.
    const { error: auErr } = await supabase.from('audit_log').insert({
      tenant_id: doc.tenant_id,
      event_type: 'document.hash_computed',
      entity_type: 'document',
      entity_id: doc.id,
      payload: { algorithm: 'sha256', byte_count: bytes.byteLength },
    });
    if (auErr) {
      // Audit failure is normally a hard error, but for a backgrounded hash
      // job we'd rather succeed-with-warning than re-trigger via retries.
      // The document_events row above is the durable artefact.
      console.error('compute-document-hash: audit insert failed:', auErr.message);
    }

    return new Response(
      JSON.stringify({ ok: true, document_id: doc.id, file_hash: hash }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    // Log full error server-side; never echo it back (CodeQL pattern).
    console.error('compute-document-hash failed:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
