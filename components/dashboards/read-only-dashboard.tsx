import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import {
  getApprovalRateByMonth,
  getMonthlyOnboardingVolume,
  getRiskBandDistribution,
  getScreeningHitRate,
} from '@/modules/reporting/queries';
import { getDailySessionVolume } from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
}

export async function ReadOnlyDashboard({ tenantId }: Props) {
  const supabase = await createClient();

  const [volume, approval, bands, hitRate, dailySessions] = await Promise.all([
    getMonthlyOnboardingVolume(supabase, tenantId, 6),
    getApprovalRateByMonth(supabase, tenantId, 6),
    getRiskBandDistribution(supabase, tenantId, 6),
    getScreeningHitRate(supabase, tenantId, 6),
    getDailySessionVolume(supabase, tenantId, 30),
  ]);

  const totalReceived = volume.reduce((s, r) => s + r.received, 0);
  const totalCompleted = volume.reduce((s, r) => s + r.completed, 0);
  const totalApproved = approval.reduce((s, r) => s + r.approved, 0);
  const totalRejected = approval.reduce((s, r) => s + r.rejected, 0);
  const totalDecisions = totalApproved + totalRejected;
  const approvalPct =
    totalDecisions > 0 ? Math.round((totalApproved / totalDecisions) * 100) : 0;

  const bandTotal = bands.reduce((s, r) => s + r.count, 0);

  return (
    <DashboardShell
      title="Compliance Reporting"
      subtitle="Aggregate metrics — last 6 months. No customer detail is shown."
      role={Role.READ_ONLY}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardWithSparkline
          label="Onboardings Received"
          value={totalReceived}
          trend={dailySessions}
          trendColor="#3b82f6"
          filled
        />
        <StatCard label="Completed" value={totalCompleted} />
        <StatCard
          label="Approval Rate"
          value={totalDecisions > 0 ? `${approvalPct}%` : '—'}
          hint={totalDecisions > 0 ? `${totalDecisions} decisions` : 'No decisions yet'}
        />
        <StatCard
          label="Screening Hit Rate"
          value={hitRate.cases_total > 0 ? `${Math.round(hitRate.rate * 100)}%` : '—'}
          hint={
            hitRate.cases_total > 0
              ? `${hitRate.cases_with_hits} / ${hitRate.cases_total} cases`
              : 'No cases yet'
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {bandTotal === 0 ? (
          <EmptyState
            title="No risk band data in the last 6 months"
            body="Risk distribution will appear once customers complete the onboarding flow."
          />
        ) : (
          <QueueSummary
            title="Risk band distribution"
            rows={['low', 'medium', 'high', 'unacceptable'].map((b) => {
              const count = bands.find((r) => r.risk_band === b)?.count ?? 0;
              const pct = bandTotal > 0 ? Math.round((count / bandTotal) * 100) : 0;
              return { label: b, value: `${count} (${pct}%)` };
            })}
            emptyText="No risk assessments in this window"
          />
        )}
        {volume.length === 0 ? (
          <EmptyState
            title="No onboarding sessions in the last 6 months"
            body="Monthly volume will appear once customers start onboarding."
          />
        ) : (
          <QueueSummary
            title="Monthly volume"
            rows={volume.map((row) => ({
              label: row.month,
              value: row.received,
              hint: `${row.completed} completed · ${row.abandoned} abandoned`,
            }))}
            emptyText="No sessions in this window"
          />
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        For deeper analysis, use the dedicated{' '}
        <Link href="/reporting" className="text-blue-600 hover:underline">
          Reporting
        </Link>{' '}
        page.
      </p>
    </DashboardShell>
  );
}
