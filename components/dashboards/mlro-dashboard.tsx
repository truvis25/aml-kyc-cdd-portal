import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import { FilterPillsClient } from './widgets/filter-pills-client';
import {
  countCasesAssignedTo,
  countCasesByQueue,
  countOpenCasesByRiskBand,
  countSarFlagged,
  countUnresolvedHits,
  getOldestOpenInQueue,
  getDailyCaseVolume,
  getSarDraftCount,
  getOverdueCasesCount,
} from '@/modules/dashboards/queries';
import { getRiskBandDistribution } from '@/modules/reporting/queries';

interface Props {
  userId: string;
  tenantId: string;
}

function daysAgo(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'opened today';
  return `oldest ${days}d open`;
}

export async function MLRODashboard({ userId, tenantId }: Props) {
  const supabase = await createClient();

  const [
    highRiskCount,
    oldestHighRisk,
    sarCount,
    escalationQueue,
    pendingApprovals,
    unresolvedHits,
    bandDistribution,
    dailyCases,
    sarDraftCount,
    overdueCases,
  ] = await Promise.all([
    countOpenCasesByRiskBand(supabase, tenantId, ['high', 'unacceptable']),
    getOldestOpenInQueue(supabase, tenantId, ['edd', 'escalation', 'senior']),
    countSarFlagged(supabase, tenantId),
    countCasesByQueue(supabase, tenantId, ['escalation']),
    countCasesAssignedTo(supabase, userId, { openOnly: true }),
    countUnresolvedHits(supabase, tenantId),
    getRiskBandDistribution(supabase, tenantId, 1),
    getDailyCaseVolume(supabase, tenantId, 30),
    getSarDraftCount(supabase, tenantId),
    getOverdueCasesCount(supabase, tenantId, 48),
  ]);

  const bandTotal = bandDistribution.reduce((sum, r) => sum + r.count, 0);
  const bandRows = ['low', 'medium', 'high', 'unacceptable'].map((b) => {
    const count = bandDistribution.find((r) => r.risk_band === b)?.count ?? 0;
    const pct = bandTotal > 0 ? Math.round((count / bandTotal) * 100) : 0;
    return { label: b, value: `${count} (${pct}%)` };
  });

  const filterPills = [
    { label: 'High Risk', filter: 'high-risk', count: highRiskCount, urgent: highRiskCount > 0 },
    { label: 'EDD', filter: 'edd' },
    { label: 'Escalations', filter: 'escalations', count: escalationQueue, urgent: escalationQueue > 0 },
    { label: 'SAR', filter: 'sar', count: sarCount, urgent: sarCount > 0 },
  ];

  return (
    <DashboardShell
      title="MLRO Compliance Oversight"
      subtitle="High-risk queue, SAR register, and escalations"
      role={Role.MLRO}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardWithSparkline
          label="High-Risk Open"
          value={highRiskCount}
          hint={daysAgo(oldestHighRisk)}
          href="/cases?queue=edd"
          urgent={highRiskCount > 0}
          trend={dailyCases}
          trendColor={highRiskCount > 0 ? '#f97316' : '#3b82f6'}
        />
        <StatCard
          label="SAR Flagged"
          value={sarCount}
          hint="Open SAR cases"
          href="/sar"
          urgent={sarCount > 0}
        />
        <StatCard
          label="SAR Drafts Pending"
          value={sarDraftCount}
          hint="Draft — not yet submitted"
          href="/sar?status=draft"
          urgent={sarDraftCount > 0}
        />
        <StatCard
          label="Cases Overdue (48h)"
          value={overdueCases}
          hint="Open / pending, no update in 48h"
          href="/cases?filter=overdue"
          urgent={overdueCases > 0}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Escalation Queue"
          value={escalationQueue}
          hint="Awaiting MLRO review"
          href="/cases?queue=escalation"
          urgent={escalationQueue > 0}
        />
        <StatCard
          label="Unresolved Hits"
          value={unresolvedHits}
          hint="Across all open cases"
        />
      </div>

      {/* Quick filter pills for queue navigation */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Queue filters</h2>
        <FilterPillsClient pills={filterPills} basePath="/cases" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {bandTotal === 0 ? (
          <EmptyState
            title="No risk assessments in the last 30 days"
            body="Risk band distribution will appear once customers complete onboarding."
          />
        ) : (
          <QueueSummary
            title="Risk band distribution (last 30 days)"
            rows={bandRows}
            emptyText="No assessments in the last 30 days"
          />
        )}
        <QueueSummary
          title="My queue"
          rows={[
            { label: 'Cases assigned to me', value: pendingApprovals, href: '/cases' },
            { label: 'Audit log', value: '→', href: '/audit' },
            { label: 'Reporting', value: '→', href: '/reporting' },
            { label: 'SAR Register', value: sarCount, href: '/sar' },
          ]}
        />
      </div>
    </DashboardShell>
  );
}
