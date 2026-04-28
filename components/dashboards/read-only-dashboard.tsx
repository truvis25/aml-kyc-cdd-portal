import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import {
  getApprovalRateByMonth,
  getMonthlyOnboardingVolume,
  getRiskBandDistribution,
  getScreeningHitRate,
} from '@/modules/reporting/queries';

interface Props {
  tenantId: string;
}

export async function ReadOnlyDashboard({ tenantId }: Props) {
  const supabase = await createClient();

  const [volume, approval, bands, hitRate] = await Promise.all([
    getMonthlyOnboardingVolume(supabase, tenantId, 6),
    getApprovalRateByMonth(supabase, tenantId, 6),
    getRiskBandDistribution(supabase, tenantId, 6),
    getScreeningHitRate(supabase, tenantId, 6),
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
        <StatCard label="Onboardings Received" value={totalReceived} />
        <StatCard label="Completed" value={totalCompleted} />
        <StatCard label="Approval Rate" value={`${approvalPct}%`} hint={`${totalDecisions} decisions`} />
        <StatCard
          label="Screening Hit Rate"
          value={`${Math.round(hitRate.rate * 100)}%`}
          hint={`${hitRate.cases_with_hits} / ${hitRate.cases_total} cases`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QueueSummary
          title="Risk band distribution"
          rows={['low', 'medium', 'high', 'unacceptable'].map((b) => {
            const count = bands.find((r) => r.risk_band === b)?.count ?? 0;
            const pct = bandTotal > 0 ? Math.round((count / bandTotal) * 100) : 0;
            return { label: b, value: `${count} (${pct}%)` };
          })}
          emptyText="No risk assessments in this window"
        />
        <QueueSummary
          title="Monthly volume"
          rows={volume.map((row) => ({
            label: row.month,
            value: row.received,
            hint: `${row.completed} completed · ${row.abandoned} abandoned`,
          }))}
          emptyText="No sessions in this window"
        />
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
