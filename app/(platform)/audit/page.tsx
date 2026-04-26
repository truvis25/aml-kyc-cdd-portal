import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants/roles';
import { hasPermission } from '@/modules/auth/rbac';

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { user_role?: Role; tenant_id?: string } | undefined;
  const role = claims?.user_role;
  const tenant_id = claims?.tenant_id;
  if (!role || !tenant_id) redirect('/sign-in?error=session_invalid');

  if (!hasPermission(role, 'audit:read')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">You do not have permission to view the audit trail.</p>
      </div>
    );
  }

  const { data: entries } = await supabase
    .from('audit_log')
    .select('id, event_type, actor_id, actor_role, entity_type, entity_id, event_time, ip_address')
    .eq('tenant_id', tenant_id)
    .order('event_time', { ascending: false })
    .limit(200);

  const EVENT_COLORS: Record<string, string> = {
    'kyc.initiated':          'text-blue-600',
    'kyb.initiated':          'text-blue-600',
    'case.opened':            'text-purple-600',
    'case.approved':          'text-green-600',
    'case.rejected':          'text-red-600',
    'case.escalated':         'text-orange-600',
    'user.invited':           'text-indigo-600',
    'user.role_assigned':     'text-indigo-600',
    'document.uploaded':      'text-teal-600',
    'screening.hit_resolved': 'text-yellow-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">Immutable record of all platform activity</p>
      </div>

      {(!entries || entries.length === 0) ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {entries.map((e) => (
                <tr key={e.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                    {new Date(e.event_time as string).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                    <span className={EVENT_COLORS[e.event_type as string] ?? 'text-gray-700'}>
                      {e.event_type as string}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">
                    {((e.actor_role as string) ?? 'system').replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    <span className="text-gray-400">{e.entity_type as string} </span>
                    <span className="font-mono">{((e.entity_id as string) ?? '').slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
                    {(e.ip_address as string) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
