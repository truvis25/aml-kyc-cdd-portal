import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CaseFilters } from '@/components/cases/case-filters';
import { CaseRealtime } from '@/components/cases/case-realtime';
import { RiskScoreDisplay } from '@/components/cases/risk-score-display';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { getPageAuth } from '@/lib/auth/page-auth';
import { hasPermission } from '@/modules/auth/rbac';
import type { RiskBand } from '@/modules/risk/risk.types';

const PAGE_SIZE = 50;

interface SearchParams {
  queue?: string;
  status?: string;
  customer_id?: string;
  page?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
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

interface CaseListRow {
  id: string;
  customer_id: string;
  status: string;
  queue: string;
  opened_at: string;
  risk_assessment_id: string | null;
  assigned_to: string | null;
}

interface RiskLookupRow {
  id: string;
  composite_score: number;
  risk_band: RiskBand;
}

export default async function CasesPage({ searchParams }: Props) {
  const filters = await searchParams;
  const { userId, role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  const canReadAssigned = hasPermission(role, 'cases:read_assigned');
  const canReadAll = hasPermission(role, 'cases:read_all');

  if (!canReadAssigned && !canReadAll) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="mt-1 text-sm text-red-700">
          Your role does not have permission to view case records.
        </p>
      </div>
    );
  }

  const currentPage = Math.max(1, parseInt(filters.page ?? '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Build query — only roles with cases:read_all see all cases; others see only assigned.
  // Fetch PAGE_SIZE + 1 to detect a next page without a separate count query.
  let q = supabase
    .from('cases')
    .select('id, customer_id, status, queue, opened_at, risk_assessment_id, assigned_to')
    .eq('tenant_id', tenant_id)
    .order('opened_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  if (!canReadAll) q = q.eq('assigned_to', userId);
  if (filters.queue) q = q.eq('queue', filters.queue);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);

  const { data: rawCases } = await q;
  const allCases = (rawCases ?? []) as unknown as CaseListRow[];
  const hasNextPage = allCases.length > PAGE_SIZE;
  const cases = hasNextPage ? allCases.slice(0, PAGE_SIZE) : allCases;

  // Batch fetch risk assessments, customer names, and assigned officer names
  const riskIds = [...new Set(cases.map((c) => c.risk_assessment_id).filter(Boolean))] as string[];
  const customerIds = [...new Set(cases.map((c) => c.customer_id))];
  const officerIds = [...new Set(cases.map((c) => c.assigned_to).filter(Boolean))] as string[];

  const [risksResult, customerDataResult, officersResult] = await Promise.all([
    riskIds.length > 0
      ? supabase.from('risk_assessments').select('id, composite_score, risk_band').in('id', riskIds)
      : Promise.resolve({ data: [] }),
    customerIds.length > 0
      ? supabase
          .from('customer_data_versions')
          .select('customer_id, full_name')
          .in('customer_id', customerIds)
          .eq('tenant_id', tenant_id)
          .order('version', { ascending: false })
      : Promise.resolve({ data: [] }),
    officerIds.length > 0
      ? supabase.from('users').select('id, display_name').in('id', officerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const riskById = new Map<string, RiskLookupRow>();
  for (const risk of (risksResult.data ?? []) as unknown as RiskLookupRow[]) {
    riskById.set(risk.id, risk);
  }

  // Keep only the latest name per customer (ordered desc, take first seen)
  const customerNameById = new Map<string, string>();
  for (const row of (customerDataResult.data ?? []) as { customer_id: string; full_name: string | null }[]) {
    if (!customerNameById.has(row.customer_id) && row.full_name) {
      customerNameById.set(row.customer_id, row.full_name);
    }
  }

  const officerNameById = new Map<string, string>();
  for (const u of (officersResult.data ?? []) as { id: string; display_name: string | null }[]) {
    officerNameById.set(u.id, u.display_name ?? u.id.slice(0, 8));
  }

  return (
    <div>
      <CaseRealtime tenantId={tenant_id} assignedTo={canReadAll ? undefined : userId} />
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filters.customer_id
              ? `Cases for customer ${filters.customer_id.slice(0, 8)}… · ${cases.length} found`
              : `${cases.length} cases`}
          </p>
        </div>
        <CaseFilters />
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title={
            filters.queue || filters.status || filters.customer_id
              ? 'No cases match these filters'
              : 'No cases yet'
          }
          description={
            filters.queue || filters.status || filters.customer_id
              ? 'Try clearing a filter, or open the full queue to see everything.'
              : canReadAll
                ? 'When customers complete onboarding and risk routing assigns them to a queue, cases land here.'
                : 'You have no cases assigned right now. Your dashboard will alert you when one is.'
          }
          action={
            filters.queue || filters.status || filters.customer_id
              ? { label: 'Clear filters', href: '/cases' }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Case ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Queue</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Risk</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Opened</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.map((c) => {
                const riskData = c.risk_assessment_id ? riskById.get(c.risk_assessment_id) : undefined;
                const statusStyle = STATUS_BADGE[c.status] ?? STATUS_BADGE.open;
                const customerName = customerNameById.get(c.customer_id);
                const officerName = c.assigned_to ? officerNameById.get(c.assigned_to) : null;

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-900">
                      {customerName ?? (
                        <span className="text-gray-400 text-xs font-mono">{c.customer_id.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{c.queue}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${statusStyle}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {riskData ? (
                        <RiskScoreDisplay
                          score={Math.round(riskData.composite_score)}
                          band={riskData.risk_band as RiskBand}
                          compact
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {officerName ?? (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.opened_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">
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
        basePath="/cases"
        params={
          new URLSearchParams({
            ...(filters.queue ? { queue: filters.queue } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.customer_id ? { customer_id: filters.customer_id } : {}),
          })
        }
        currentPage={currentPage}
        rowsOnPage={cases.length}
        pageSize={PAGE_SIZE}
        hasNextPage={hasNextPage}
      />
    </div>
  );
}
