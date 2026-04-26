import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Role } from '@/lib/constants/roles';

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-yellow-50 border-yellow-200 text-yellow-700',
  in_progress: 'bg-blue-50 border-blue-200 text-blue-700',
  submitted:   'bg-purple-50 border-purple-200 text-purple-700',
  approved:    'bg-green-50 border-green-200 text-green-700',
  rejected:    'bg-red-50 border-red-200 text-red-700',
  suspended:   'bg-gray-50 border-gray-200 text-gray-600',
};

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { user_role?: Role; tenant_id?: string } | undefined;
  const role = claims?.user_role;
  const tenant_id = claims?.tenant_id;
  if (!role || !tenant_id) redirect('/sign-in?error=session_invalid');

  const isAnalystOnly = role === 'analyst' || role === 'onboarding_agent' || role === 'read_only';

  let q = supabase
    .from('customers')
    .select('id, customer_type, status, created_at, latest_version')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Analysts only see customers they have cases assigned for
  if (isAnalystOnly) {
    const { data: assignedCases } = await supabase
      .from('cases')
      .select('customer_id')
      .eq('tenant_id', tenant_id)
      .eq('assigned_to', user.id);
    const ids = (assignedCases ?? []).map((c) => c.customer_id as string).filter(Boolean);
    if (ids.length === 0) {
      return (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-1">Customers assigned to you</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No customers assigned to you yet.</p>
          </div>
        </div>
      );
    }
    q = q.in('id', ids);
  }

  type CustomerRow = { id: string; customer_type: string; status: string; created_at: string; latest_version: number };
  const { data: rawCustomers } = await q;
  const customers = (rawCustomers ?? []) as unknown as CustomerRow[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAnalystOnly ? 'Customers assigned to you' : 'All customers in your tenant'}
        </p>
      </div>

      {(!customers || customers.length === 0) ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No customers yet.</p>
          <p className="text-xs text-gray-400 mt-1">Customers are created through the onboarding flow.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    <Link href={`/cases?customer_id=${c.id}`} className="hover:text-blue-600 hover:underline">
                      {c.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                    {c.customer_type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">v{c.latest_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
