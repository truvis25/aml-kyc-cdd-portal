import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import { ExportCsvClient, type CsvRow } from './widgets/export-csv-client';
import { RangeSelectorClient, type ReadOnlyRange } from './widgets/range-selector-client';
import {
  getApprovalRateByMonth,
  getMonthlyOnboardingVolume,
  getRiskBandDistribution,
  getScreeningHitRate,
} from '@/modules/reporting/queries';
import { getDailySessionVolume } from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
  /** Injected from the page's searchParams — defaults to 30d. */
  range?: ReadOnlyRange;
}

/** Compute months-back from the range param. */
function rangeToMonths(range: ReadOnlyRange): number {
  if (range === '90d') return 3;
  if (range === 'ytd') {
    const now = new Date();
    return Math.max(1, now.getUTCMonth() + 1);
  }
  return 1; // 30d → ~1 month
}

interface DeltaBadgeProps {
  curr: number;
  prev: number;
}

/**
 * Renders a green/red MoM delta badge. Returns null when there is no prior period data.
 * Only aggregate counts are used here — no PII.
 */
function DeltaBadge({ curr, prev }: DeltaBadgeProps) {
  if (prev === 0) return null;
  const delta = Math.round(((curr - prev) / prev) * 100);
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
      aria-label={`Month-over-month: ${positive ? '+' : ''}${delta}%`}
    >
      {positive ? '+' : ''}{delta}% MoM
    </span>
  );
}

export async function ReadOnlyDashboard({ tenantId, range = '30d' }: Props) {
  const supabase = await createClient();

  const monthsBack = rangeToMonths(range);
  // Prior period: equal-length window before current window (for MoM/period deltas)
  const priorMonthsBack = monthsBack * 2;

  const [volume, approval, bands, hitRate, dailySessions, priorVolume, priorApproval] =
    await Promise.all([
      getMonthlyOnboardingVolume(supabase, tenantId, monthsBack),
      getApprovalRateByMonth(supabase, tenantId, monthsBack),
      getRiskBandDistribution(supabase, tenantId, monthsBack),
      getScreeningHitRate(supabase, tenantId, monthsBack),
      getDailySessionVolume(supabase, tenantId, 30),
      // Prior period for delta badges — full 2x window; we compare first vs second half
      getMonthlyOnboardingVolume(supabase, tenantId, priorMonthsBack),
      getApprovalRateByMonth(supabase, tenantId, priorMonthsBack),
    ]);

  // Current period aggregates
  const totalReceived = volume.reduce((s, r) => s + r.received, 0);
  const totalCompleted = volume.reduce((s, r) => s + r.completed, 0);
  const totalApproved = approval.reduce((s, r) => s + r.approved, 0);
  const totalRejected = approval.reduce((s, r) => s + r.rejected, 0);
  const totalDecisions = totalApproved + totalRejected;
  const approvalPct =
    totalDecisions > 0 ? Math.round((totalApproved / totalDecisions) * 100) : 0;

  // Prior period: the older half of the doubled window
  const priorReceivedTotal = priorVolume.slice(0, monthsBack).reduce((s, r) => s + r.received, 0);
  const priorCompletedTotal = priorVolume.slice(0, monthsBack).reduce((s, r) => s + r.completed, 0);
  const priorApprovedTotal = priorApproval.slice(0, monthsBack).reduce((s, r) => s + r.approved, 0);
  const priorRejectedTotal = priorApproval.slice(0, monthsBack).reduce((s, r) => s + r.rejected, 0);
  const priorDecisionsTotal = priorApprovedTotal + priorRejectedTotal;
  const priorApprovalPct =
    priorDecisionsTotal > 0 ? Math.round((priorApprovedTotal / priorDecisionsTotal) * 100) : 0;

  const bandTotal = bands.reduce((s, r) => s + r.count, 0);

  // CSV rows — aggregate only, no PII
  const csvRows: CsvRow[] = volume.map((row) => {
    const approvalRow = approval.find((a) => a.month === row.month);
    const decisions = approvalRow ? approvalRow.approved + approvalRow.rejected : 0;
    const pct =
      decisions > 0 && approvalRow
        ? Math.round((approvalRow.approved / decisions) * 100)
        : 0;
    return {
      month: row.month,
      received: row.received,
      completed: row.completed,
      abandoned: row.abandoned,
      approval_pct: pct,
    };
  });

  const rangeLabel =
    range === '30d' ? 'Last 30 days' : range === '90d' ? 'Last 90 days' : 'Year to date';

  return (
    <DashboardShell
      title="Compliance Reporting"
      subtitle={`Aggregate metrics — ${rangeLabel.toLowerCase()}. No customer detail is shown.`}
      role={Role.READ_ONLY}
    >
      {/* Time range selector + export button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Time range:</span>
          <RangeSelectorClient activeRange={range} />
        </div>
        <ExportCsvClient
          rows={csvRows}
          filename={`compliance-report-${range}`}
          label="Export CSV"
        />
      </div>

      {/* Stat cards with MoM delta badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <StatCardWithSparkline
            label="Onboardings Received"
            value={totalReceived}
            trend={dailySessions}
            trendColor="#3b82f6"
            filled
          />
          <div className="mt-1 px-1">
            <DeltaBadge curr={totalReceived} prev={priorReceivedTotal} />
          </div>
        </div>

        <div>
          <StatCard label="Completed" value={totalCompleted} />
          <div className="mt-1 px-1">
            <DeltaBadge curr={totalCompleted} prev={priorCompletedTotal} />
          </div>
        </div>

        <div>
          <StatCard
            label="Approval Rate"
            value={totalDecisions > 0 ? `${approvalPct}%` : '—'}
            hint={totalDecisions > 0 ? `${totalDecisions} decisions` : 'No decisions yet'}
          />
          <div className="mt-1 px-1">
            <DeltaBadge curr={approvalPct} prev={priorApprovalPct} />
          </div>
        </div>

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
            title={`No risk band data in the ${rangeLabel.toLowerCase()}`}
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
            title={`No onboarding sessions in the ${rangeLabel.toLowerCase()}`}
            body="Monthly volume will appear once customers start onboarding."
          />
        ) : (
          <QueueSummary
            title={`Monthly volume — ${rangeLabel}`}
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
