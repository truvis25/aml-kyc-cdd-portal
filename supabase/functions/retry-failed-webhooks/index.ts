// Edge Function: retry-failed-webhooks
//
// Hourly pg_cron entry point. Triggers each provider-specific processor;
// those processors do the actual work (claim → process → mark) including
// retrying any `failed` events whose next_retry_at has elapsed.
//
// Why this exists when both processors are independently invokable: a single
// cron schedule is easier to operate than N. Adding a new provider only
// touches this fan-out, not the cron config.
//
// Auth: verify_jwt = false; pg_cron supplies the service-role JWT in the
// Authorization header but Edge Function policy lets unauthenticated calls
// through too — the function itself reads no user input and does no
// privileged work the database wouldn't already let service_role do.

const PROCESSORS = ['process-screening-webhook', 'process-idv-webhook'] as const;

interface ProcessorResult {
  processor: string;
  ok: boolean;
  status: number;
  body: unknown;
}

async function invokeProcessor(name: string): Promise<ProcessorResult> {
  const baseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!baseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const res = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { processor: name, ok: res.ok, status: res.status, body };
}

Deno.serve(async () => {
  const results = await Promise.all(PROCESSORS.map((p) => invokeProcessor(p)));
  const anyFailed = results.some((r) => !r.ok);

  return new Response(JSON.stringify({ ok: !anyFailed, results }), {
    status: anyFailed ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
