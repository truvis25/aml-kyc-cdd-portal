// Webhook queue helpers — claim/processed/failed transitions for webhook_events.
// All three operations are server-side SQL functions added in migration 0028;
// the helpers here are thin wrappers so Edge Functions don't repeat themselves.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface WebhookEvent {
  id: string;
  tenant_id: string | null;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  signature: string | null;
  status: string;
  attempts: number;
  last_error: string | null;
  received_at: string;
  processed_at: string | null;
  next_retry_at: string | null;
}

/**
 * Atomically claim the next pending or retry-due event for a provider.
 * Returns null if the queue is empty for this provider.
 */
export async function claimNextEvent(
  supabase: SupabaseClient,
  provider: string,
): Promise<WebhookEvent | null> {
  const { data, error } = await supabase.rpc('claim_pending_webhook_event', {
    p_provider: provider,
  });
  if (error) throw new Error(`claim_pending_webhook_event failed: ${error.message}`);
  // The function returns the row or NULL when nothing matches.
  if (!data) return null;
  return data as WebhookEvent;
}

export async function markProcessed(
  supabase: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { error } = await supabase.rpc('mark_webhook_event_processed', {
    p_event_id: eventId,
  });
  if (error) throw new Error(`mark_webhook_event_processed failed: ${error.message}`);
}

export async function markFailed(
  supabase: SupabaseClient,
  eventId: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase.rpc('mark_webhook_event_failed', {
    p_event_id: eventId,
    p_error: errorMessage.slice(0, 2000), // hard cap — no point persisting megabytes of stack
  });
  if (error) throw new Error(`mark_webhook_event_failed failed: ${error.message}`);
}

/**
 * Drain a provider's queue: claim → process → mark, repeated until either the
 * queue is empty or `maxIterations` is hit. The cap prevents a long-running
 * function invocation from being killed mid-batch.
 */
export async function drainQueue(
  supabase: SupabaseClient,
  provider: string,
  process: (event: WebhookEvent) => Promise<void>,
  maxIterations: number,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < maxIterations; i++) {
    const event = await claimNextEvent(supabase, provider);
    if (!event) break;

    try {
      await process(event);
      await markProcessed(supabase, event.id);
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markFailed(supabase, event.id, message);
      failed++;
    }
  }

  return { processed, failed };
}
