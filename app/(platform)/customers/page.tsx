import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getPageAuth } from '@/lib/auth/page-auth';
import { hasPermission } from '@/modules/auth/rbac';
import { CustomerFilters } from '@/components/customers/customer-filters';

interface SearchParams {
  status?: string;
  type?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-yellow-50 border-yellow-200 text-yellow-700',
  in_progress: 'bg-blue-50 border-blue-200 text-blue-700',
  submitted:   'bg-purple-50 border-purple-200 text-purple-700',
  approved:    'bg-green-50 border-green-200 text-green-700',
  rejected:    'bg-red-50 border-red-200 text-red-700',
  suspended:   'bg-gray-50 border-gray-200 text-gray-600',
};

interface CustomerRow {
  id: string;
  customer_type: string;
  status: string;
  created_at: string;
}

interface DataVersionRow {
  customer_id: string;
  full_name: string | null;
  version: number;
}

interface CaseRow {
  customer_id: string;
  assigned_to: string | null;
  status: string;
}

interface UserRow {
  id: string;
  display_name: string | null;
}

export default async function CustomersPage({ searchParams }: Props) {
  const filters = await searchParams;
  const { userId, role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  const canReadAll = hasPermission(role, 'customers:read_all');
  const isAnalystOnly = !canReadAll;

  // Build base query
  let q = supabase
    .from('customers')
    .select('id, customer_type, status, created_at')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.status) q = q.eq('status', filters.status);
  if (filters.type) q = q.eq('customer_type', filters.type);

  // Analysts only see customers they have a case assigned for
  let customerIds: string[] = [];
  if (isAnalystOnly) {
    const { data: assignedCases } = await supabase
      .from('cases')
      .select('customer_id')
      .eq('tenant_id', tenant_id)
      .eq('assigned_to', userId);
    customerIds = (assignedCases ?? []).map((c) => c.customer_id as string).filter(Boolean);
    if (customerIds.length === 0) {
      return (
        <div>
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-500 mt-1">Customers assigned to you</p>
            </div>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No customers assigned to you yet.</p>
          </div>
        </div>
      );
    }
    q = q.in('id', customerIds);
  }

  const { data: rawCustomers } = await q;
  const customers = (rawCustomers ?? []) as unknown as CustomerRow[];
  const ids = customers.map((c) => c.id);

  if (ids.length === 0) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-1">0 customers</p>
          </div>
          <CustomerFilters />
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No customers match the selected filters.</p>
        </div>
      </div>
    );
  }

  // Batch-fetch names and case assignments in parallel
  const [dataResult, casesResult] = await Promise.all([
    supabase
      .from('customer_data_versions')
      .select('customer_id, full_name, version')
      .in('customer_id', ids)
      .eq('tenant_id', tenant_id)
      .order('version', { ascending: false }),
    supabase
      .from('cases')
      .select('customer_id, assigned_to, status')
      .in('customer_id', ids)
      .eq('tenant_id', tenant_id)
      .order('opened_at', { ascending: false }),
  ]);

  // Latest name per customer (rows are ordered desc by version)
  const nameByCustomerId = new Map<string, string>();
  for (const dv of (dataResult.data ?? []) as unknown as DataVersionRow[]) {
    if (!nameByCustomerId.has(dv.customer_id) && dv.full_name) {
      nameByCustomerId.set(dv.customer_id, dv.full_name);
    }
  }

  // Latest case per customer
  const caseByCustomerId = new Map<string, CaseRow>();
  for (const c of (casesResult.data ?? []) as unknown as CaseRow[]) {
    if (!caseByCustomerId.has(c.customer_id)) {
      caseByCustomerId.set(c.customer_id, c);
    }
  }

  // Fetch reviewer display names
  const reviewerIds = [
    ...new Set(
      [...caseByCustomerId.values()]
        .map((c) => c.assigned_to)
        .filter(Boolean) as string[]
    ),
  ];
  const reviewerByUserId = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', reviewerIds);
    for (const r of (reviewers ?? []) as unknown as UserRow[]) {
      reviewerByUserId.set(r.id, r.display_name ?? `${r.id.slice(0, 8)}…`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAnalystOnly ? 'Customers assigned to you' : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <CustomerFilters />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Reviewer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => {
              const name = nameByCustomerId.get(c.id);
              const caseData = caseByCustomerId.get(c.id);
              const reviewer = caseData?.assigned_to
                ? reviewerByUserId.get(caseData.assigned_to)
                : undefined;
              const statusStyle = STATUS_BADGE[c.status] ?? 'bg-gray-50 border-gray-200 text-gray-600';
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {name ?? <span className="text-gray-400 text-xs italic">Pending identity</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {c.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">
                    {c.customer_type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {reviewer ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
