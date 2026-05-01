import Link from 'next/link';
import { Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPageAuth } from '@/lib/auth/page-auth';
import { assertPermission } from '@/modules/auth/rbac';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { listSarReports } from '@/modules/sar';
import { CreateSarFromCaseButton } from '@/components/sar/create-sar-from-case';

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
  status?: 'all' | 'draft' | 'submitted';
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-50 border-gray-200 text-gray-700',
  ready: 'bg-blue-50 border-blue-200 text-blue-700',
  submitted: 'bg-purple-50 border-purple-200 text-purple-700',
  acknowledged: 'bg-green-50 border-green-200 text-green-700',
  rejected: 'bg-red-50 border-red-200 text-red-700',
};

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function SARRegisterPage({ searchParams }: Props) {
  const { userId, role, tenantId } = await getPageAuth();
  // Gate: only roles that can flag SAR (MLRO + tenant_admin) see the register.
  // Per ROLES_DASHBOARDS_FLOWS.md §7, analysts and senior reviewers are intentionally
  // blind to SAR status (tipping-off prevention).
  assertPermission(role, 'cases:flag_sar');

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter: 'all' | 'draft' | 'submitted' = sp.status ?? 'all';

  const { reports, total } = await listSarReports(
    { tenantId, userId, role },
    {
      limit: PAGE_SIZE + 1,
      offset,
      status:
        statusFilter === 'draft'
          ? 'draft'
          : statusFilter === 'submitted'
            ? 'submitted'
            : undefined,
    },
  );

  const hasNextPage = reports.length > PAGE_SIZE;
  const visibleReports = hasNextPage ? reports.slice(0, PAGE_SIZE) : reports;

  // Cases flagged for SAR that don't yet have a draft report. This surfaces
  // outstanding work — every flag should eventually become a formal report or
  // be unflagged with a justification note.
  const supabase = await createClient();
  const reportedCaseIds = new Set(reports.map((r) => r.case_id));
  const { data: flaggedCases } = await supabase
    .from('cases')
    .select('id, customer_id, status, opened_at')
    .eq('tenant_id', tenantId)
    .eq('sar_flagged', true)
    .order('opened_at', { ascending: false })
    .limit(50);

  const pendingDraft = (
    (flaggedCases ?? []) as { id: string; customer_id: string; status: string; opened_at: string }[]
  ).filter((c) => !reportedCaseIds.has(c.id));

  // Resolve customer names for both lists in one batch.
  const customerIds = [
    ...new Set([
      ...visibleReports.map((r) => r.customer_id),
      ...pendingDraft.map((c) => c.customer_id),
    ]),
  ];
  const { data: customerData } = customerIds.length
    ? await supabase
        .from('customer_data_versions')
        .select('customer_id, full_name')
        .in('customer_id', customerIds)
        .eq('tenant_id', tenantId)
        .order('version', { ascending: false })
    : { data: [] as { customer_id: string; full_name: string | null }[] };

  const nameById = new Map<string, string>();
  for (const row of (customerData ?? []) as {
    customer_id: string;
    full_name: string | null;
  }[]) {
    if (!nameById.has(row.customer_id) && row.full_name) {
      nameById.set(row.customer_id, row.full_name);
    }
  }

  const tabs: Array<{ value: 'all' | 'draft' | 'submitted'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'submitted', label: 'Submitted' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SAR Register</h1>
          <p className="text-sm text-gray-500 mt-1">
            Suspicious Activity Reports for the UAE FIU (goAML).{' '}
            <span className="text-gray-700">{total} total</span>
            {' · '}
            <span className="text-gray-700">{pendingDraft.length} cases awaiting draft</span>
          </p>
        </div>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-xs">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === 'all' ? '/sar' : `/sar?status=${tab.value}`}
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

      {pendingDraft.length > 0 && statusFilter === 'all' && (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-900">
              Cases flagged for SAR — no draft yet
            </h2>
            <span className="text-xs text-amber-800">{pendingDraft.length} pending</span>
          </div>
          <ul className="space-y-2">
            {pendingDraft.slice(0, 8).map((c) => {
              const name = nameById.get(c.customer_id);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between bg-white rounded-md border border-amber-200 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cases/${c.id}`}
                      className="text-blue-600 hover:underline font-mono text-xs"
                    >
                      {c.id.slice(0, 8)}…
                    </Link>
                    <span className="text-gray-800">
                      {name ?? (
                        <span className="text-gray-400 font-mono text-xs">
                          {c.customer_id.slice(0, 8)}…
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <CreateSarFromCaseButton caseId={c.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {visibleReports.length === 0 ? (
        <EmptyState
          icon={<Flag className="h-5 w-5" />}
          title={
            statusFilter !== 'all'
              ? `No SAR reports in "${statusFilter}" status`
              : 'No SAR reports yet'
          }
          description={
            statusFilter !== 'all'
              ? 'Switch the filter to see drafts and submitted reports.'
              : 'When the MLRO flags a case for SAR, the draft report appears here for review and goAML XML export.'
          }
          action={statusFilter !== 'all' ? { label: 'Show all', href: '/sar' } : undefined}
          hint="SAR visibility is restricted to Tenant Admin and MLRO under tipping-off rules."
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reasons</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Total (AED)
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleReports.map((r) => {
                const statusStyle = STATUS_BADGE[r.status] ?? STATUS_BADGE.draft;
                const name = nameById.get(r.customer_id);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {r.reference_number}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {name ?? (
                        <span className="text-gray-400 text-xs font-mono">
                          {r.customer_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {r.reason_codes.join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${statusStyle}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {r.total_amount_aed.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/sar/${r.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Open →
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
          new URLSearchParams(statusFilter !== 'all' ? { status: statusFilter } : {})
        }
        currentPage={currentPage}
        rowsOnPage={visibleReports.length}
        pageSize={PAGE_SIZE}
        hasNextPage={hasNextPage}
      />

      <p className="mt-6 text-xs text-gray-400">
        SAR visibility is restricted to MLRO and Tenant Admin to prevent tipping-off (PRD §7).
        goAML XML downloads emit an immutable audit event with the SHA-256 hash of the export.
      </p>
    </div>
  );
}
