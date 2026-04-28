import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-blue-50 border-blue-200 text-blue-700',
  processing:  'bg-purple-50 border-purple-200 text-purple-700',
  processed:   'bg-green-50 border-green-200 text-green-700',
  failed:      'bg-orange-50 border-orange-200 text-orange-700',
  dead_letter: 'bg-red-50 border-red-200 text-red-700',
};

interface WebhookEventRow {
  id: string;
  tenant_id: string | null;
  provider: string;
  event_type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  received_at: string;
  processed_at: string | null;
  next_retry_at: string | null;
}

/**
 * Operational read-only view of the webhook_events queue. Lets ops triage
 * the dead-letter pile or watch a backlog drain. Mutations (replay, etc.)
 * still go through SQL per `docs/RUNBOOK.md` §6 — no APIs to reset queue
 * state are exposed here, which keeps blast radius small.
 *
 * Gate: tenant_admin / platform_super_admin (audit:read covers both).
 * RLS already restricts webhook_events.SELECT to those roles per migration
 * 0016, so this is also belt-and-braces.
 */
export default async function AdminWebhooksPage() {
  const { role } = await getPageAuth();

  if (!hasPermission(role, 'audit:read')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">
          Webhook queue inspection is restricted to Tenant Admin and MLRO.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rawEvents } = await supabase
    .from('webhook_events')
    .select(
      'id, tenant_id, provider, event_type, status, attempts, last_error, received_at, processed_at, next_retry_at',
    )
    .order('received_at', { ascending: false })
    .limit(200);

  const events = (rawEvents ?? []) as unknown as WebhookEventRow[];

  // Headline counts by status — useful for "is the queue draining?" at a glance.
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Webhook Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Inbound provider webhooks (last 200). Status transitions are managed by
          the Edge Functions and the hourly retry job — see{' '}
          <code className="font-mono text-[11px] bg-gray-100 px-1 rounded">docs/RUNBOOK.md §6</code>{' '}
          for triage.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['pending', 'processing', 'processed', 'failed', 'dead_letter'] as const).map((s) => (
          <div
            key={s}
            className={`rounded border px-3 py-2 ${STATUS_BADGE[s] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            <p className="text-[11px] uppercase tracking-wider opacity-80">{s.replace(/_/g, ' ')}</p>
            <p className="text-xl font-semibold">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No webhook events recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next retry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {events.map((e) => {
                const badge = STATUS_BADGE[e.status] ?? 'bg-gray-50 border-gray-200 text-gray-600';
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {new Date(e.received_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{e.provider}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{e.event_type}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badge}`}
                      >
                        {e.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 tabular-nums">{e.attempts}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {e.next_retry_at ? new Date(e.next_retry_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-md truncate" title={e.last_error ?? undefined}>
                      {e.last_error ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Read-only. To replay a dead-letter event, follow the SQL recipe in the runbook.
      </p>
    </div>
  );
}
