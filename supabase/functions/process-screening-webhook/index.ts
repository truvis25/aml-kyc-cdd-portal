// Edge Function: process-screening-webhook
//
// Drains pending screening webhook events from `webhook_events` (provider =
// 'complyadvantage'). For each event we resolve the matching screening_jobs
// row by external_job_id, insert any new screening_hits, and mark the job
// completed.
//
// Invoked by:
//   - retry-failed-webhooks (on its hourly pg_cron tick)
//   - direct HTTP call after enqueue (if/when /api/webhooks/screening posts
//     here for low-latency processing — currently it just enqueues)
//
// Auth: verify_jwt = false (see supabase/config.toml). Uses the service-role
// key at the database layer so RLS isn't a constraint.

import { createServiceRoleClient } from '../_shared/supabase-client.ts';
import {
  drainQueue,
  type WebhookEvent,
} from '../_shared/webhook-queue.ts';

const PROVIDER = 'complyadvantage';
const MAX_ITERATIONS = 10; // bounded so a single invocation can't run away

interface CAHit {
  hit_type?: string;
  match_name?: string;
  match_score?: number;
  raw_data?: Record<string, unknown>;
}

interface CAPayload {
  external_job_id?: string;
  job_id?: string;          // some webhook variants use job_id directly
  status?: string;          // 'completed' | 'failed' | ...
  hits?: CAHit[];
}

async function processScreeningEvent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  event: WebhookEvent,
): Promise<void> {
  const payload = event.payload as CAPayload;
  const externalJobId = payload.external_job_id ?? payload.job_id;
  if (!externalJobId) {
    throw new Error('Payload missing external_job_id / job_id');
  }

  const { data: jobRow, error: jobError } = await supabase
    .from('screening_jobs')
    .select('id, tenant_id, customer_id, status')
    .eq('external_job_id', externalJobId)
    .maybeSingle();

  if (jobError) throw new Error(`screening_jobs lookup failed: ${jobError.message}`);
  if (!jobRow) throw new Error(`No screening_jobs row for external_job_id=${externalJobId}`);

  const job = jobRow as {
    id: string;
    tenant_id: string;
    customer_id: string;
    status: string;
  };

  if (payload.status === 'failed') {
    const { error } = await supabase
      .from('screening_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', job.id);
    if (error) throw new Error(`Failed to mark job failed: ${error.message}`);
    return;
  }

  const incomingHits = Array.isArray(payload.hits) ? payload.hits : [];
  if (incomingHits.length > 0) {
    const rows = incomingHits.map((h) => ({
      tenant_id: job.tenant_id,
      job_id: job.id,
      customer_id: job.customer_id,
      hit_type: h.hit_type ?? 'watchlist',
      match_name: h.match_name ?? '(unknown)',
      match_score: h.match_score ?? null,
      raw_data: h.raw_data ?? {},
      status: 'pending',
    }));
    const { error: hitErr } = await supabase.from('screening_hits').insert(rows);
    if (hitErr) throw new Error(`screening_hits insert failed: ${hitErr.message}`);
  }

  const { error: completeErr } = await supabase
    .from('screening_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', job.id);
  if (completeErr) throw new Error(`Failed to mark job completed: ${completeErr.message}`);
}

Deno.serve(async () => {
  const supabase = createServiceRoleClient();
  try {
    const result = await drainQueue(
      supabase,
      PROVIDER,
      (event) => processScreeningEvent(supabase, event),
      MAX_ITERATIONS,
    );
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Log full error server-side; never echo it back. The caller (pg_cron)
    // only needs the non-200 status to retry.
    console.error('process-screening-webhook failed:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
