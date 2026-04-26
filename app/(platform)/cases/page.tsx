import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CaseFilters } from '@/components/cases/case-filters';
import { RiskScoreDisplay } from '@/components/cases/risk-score-display';
import type { Role } from '@/lib/constants/roles';
import type { RiskBand } from '@/modules/risk/risk.types';

interface SearchParams {
  queue?: string;
  status?: string;
  customer_id?: string;
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { user_role?: Role; tenant_id?: string } | undefined;
  const role = claims?.user_role;
  const tenant_id = claims?.tenant_id;
  if (!role || !tenant_id) redirect('/sign-in?error=session_invalid');


  // Build query — analysts see only assigned cases
  const isAnalystOnly = role === 'analyst' || role === 'onboarding_agent' || role === 'read_only';
  let q = supabase
    .from('cases')
    .select('id, status, queue, opened_at, risk_assessment_id, assigned_to')
    .eq('tenant_id', tenant_id)
    .order('opened_at', { ascending: false })
    .limit(50);

  if (isAnalystOnly) q = q.eq('assigned_to', user.id);
  if (filters.queue) q = q.eq('queue', filters.queue);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);

  const { data: rawCases } = await q;
  const cases = (rawCases ?? []) as unknown as CaseListRow[];
  const riskIds = [...new Set(cases.map((c) => c.risk_assessment_id).filter(Boolean))] as string[];
  const riskById = new Map<string, RiskLookupRow>();

  if (riskIds.length > 0) {
    const { data: risks } = await supabase
      .from('risk_assessments')
      .select('id, composite_score, risk_band')
      .in('id', riskIds);

    for (const risk of (risks ?? []) as unknown as RiskLookupRow[]) {
      riskById.set(risk.id, risk);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filters.customer_id
              ? `Cases for customer ${filters.customer_id.slice(0, 8)}… · ${cases?.length ?? 0} found`
              : `${cases?.length ?? 0} cases`}
          </p>
        </div>
        <CaseFilters />
      </div>

      {!cases?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">No cases found matching the selected filters.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Case ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Queue</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Risk</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Opened</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.map((c) => {
                const riskData = c.risk_assessment_id ? riskById.get(c.risk_assessment_id) : undefined;
                const statusStyle = STATUS_BADGE[c.status] ?? STATUS_BADGE.open;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.id.slice(0, 8)}…</td>
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
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.opened_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
