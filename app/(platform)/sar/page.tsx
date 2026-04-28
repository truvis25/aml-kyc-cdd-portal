import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPageAuth } from '@/lib/auth/page-auth';
import { assertPermission } from '@/modules/auth/rbac';
import { Pagination } from '@/components/shared/pagination';

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
  status?: 'all' | 'open' | 'closed';
}

interface SarRow {
  id: string;
  customer_id: string;
  status: string;
  queue: string;
  opened_at: string;
  closed_at: string | null;
  assigned_to: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-50 border-blue-200 text-blue-700',
  in_review: 'bg-purple-50 border-purple-200 text-purple-700',
  pending_info: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  escalated: 'bg-orange-50 border-orange-200 text-orange-700',
  approved: 'bg-green-50 border-green-200 text-green-700',
  rejected: 'bg-red-50 border-red-200 text-red-700',
  closed: 'bg-gray-50 border-gray-200 text-gray-600',
};

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function SARRegisterPage({ searchParams }: Props) {
  const { role, tenantId } = await getPageAuth();
  // Gate: only roles that can flag SAR are entitled to see the SAR register.
  // Per ROLES_DASHBOARDS_FLOWS.md §7, analysts and senior reviewers are intentionally
  // blind to SAR status (tipping-off prevention).
  assertPermission(role, 'cases:flag_sar');

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter: 'all' | 'open' | 'closed' = sp.status ?? 'open';

  const supabase = await createClient();

  let q = supabase
    .from('cases')
    .select('id, customer_id, status, queue, opened_at, closed_at, assigned_to, sar_flagged')
    .eq('tenant_id', tenantId)
    .eq('sar_flagged', true)
    .order('opened_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE);
  if (statusFilter === 'open') q = q.neq('status', 'closed');
  else if (statusFilter === 'closed') q = q.eq('status', 'closed');

  const { data: rawCases } = await q;

  const allRows = (rawCases ?? []) as unknown as (SarRow & { sar_flagged: boolean })[];
  const hasNextPage = allRows.length > PAGE_SIZE;
  const cases = hasNextPage ? allRows.slice(0, PAGE_SIZE) : allRows;
  const open = cases.filter((c) => c.status !== 'closed').length;
  const closed = cases.filter((c) => c.status === 'closed').length;

  const customerIds = [...new Set(cases.map((c) => c.customer_id))];
  const officerIds = [
    ...new Set(cases.map((c) => c.assigned_to).filter(Boolean)),
  ] as string[];

  const [customerDataResult, officersResult] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from('customer_data_versions')
          .select('customer_id, full_name')
          .in('customer_id', customerIds)
          .eq('tenant_id', tenantId)
          .order('version', { ascending: false })
      : Promise.resolve({ data: [] }),
    officerIds.length > 0
      ? supabase.from('users').select('id, display_name').in('id', officerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const customerNameById = new Map<string, string>();
  for (const row of (customerDataResult.data ?? []) as {
    customer_id: string;
    full_name: string | null;
  }[]) {
    if (!customerNameById.has(row.customer_id) && row.full_name) {
      customerNameById.set(row.customer_id, row.full_name);
    }
  }

  const officerNameById = new Map<string, string>();
  for (const u of (officersResult.data ?? []) as {
    id: string;
    display_name: string | null;
  }[]) {
    officerNameById.set(u.id, u.display_name ?? u.id.slice(0, 8));
  }

  const filterTabs: Array<{ value: 'open' | 'closed' | 'all'; label: string }> = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SAR Register</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cases flagged for Suspicious Activity Report review · showing{' '}
            <span className="text-gray-700">{cases.length}</span>
            {' · '}
            <span className="text-gray-700">{open} open</span>
            {' · '}
            <span className="text-gray-700">{closed} closed</span>
            {' on this page'}
          </p>
        </div>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-xs">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === 'open' ? '/sar' : `/sar?status=${tab.value}`}
                className={`px-3 py-1.5 rounded font-medium ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">No cases are currently flagged as SAR.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Case</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Queue</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Flagged</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.map((c) => {
                const statusStyle = STATUS_BADGE[c.status] ?? STATUS_BADGE.open;
                const customerName = customerNameById.get(c.customer_id);
                const officerName = c.assigned_to ? officerNameById.get(c.assigned_to) : null;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {c.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {customerName ?? (
                        <span className="text-gray-400 text-xs font-mono">
                          {c.customer_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{c.queue}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${statusStyle}`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {officerName ?? <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(c.opened_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/sar"
        params={
          new URLSearchParams(
            statusFilter !== 'open' ? { status: statusFilter } : {},
          )
        }
        currentPage={currentPage}
        rowsOnPage={cases.length}
        pageSize={PAGE_SIZE}
        hasNextPage={hasNextPage}
      />

      <p className="mt-6 text-xs text-gray-400">
        SAR visibility is restricted to MLRO and Tenant Admin to prevent tipping-off (PRD §7).
      </p>
    </div>
  );
}
