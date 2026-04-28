// Edge Function: process-idv-webhook
//
// Drains pending IDV webhook events from `webhook_events` (provider =
// 'sumsub'). The full Sumsub integration — signature verification,
// kyc_results table writes, biometric/liveness extraction — lands with the
// dedicated IDV migration (planned for the next sprint). For now this
// function exists so events do not stall in the queue: it logs the payload
// keys and marks the event processed. A failed signature check (when
// implemented) will throw, which mark_webhook_event_failed() handles with
// exponential backoff.

import { createServiceRoleClient } from '../_shared/supabase-client.ts';
import {
  drainQueue,
  type WebhookEvent,
} from '../_shared/webhook-queue.ts';

const PROVIDER = 'sumsub';
const MAX_ITERATIONS = 10;

async function processIdvEvent(event: WebhookEvent): Promise<void> {
  // Placeholder: real implementation will verify HMAC-SHA1 signature,
  // upsert into kyc_results (immutable), and emit audit events.
  // [IDV-INTEGRATION] tracked separately — Sumsub credentials gate the build.
  const keys = Object.keys(event.payload ?? {});
  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'idv_webhook_received',
      event_id: event.id,
      payload_keys: keys,
      attempts: event.attempts,
    }),
  );
}

Deno.serve(async () => {
  const supabase = createServiceRoleClient();
  try {
    const result = await drainQueue(
      supabase,
      PROVIDER,
      (event) => processIdvEvent(event),
      MAX_ITERATIONS,
    );
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
