import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import {
  countCasesAssignedTo,
  countCasesAssignedToWithStatus,
  countOverdueAssignedCases,
  getRecentDecisionsByUser,
  getAnalystAvgDecisionTime,
  getEscalatedCasesByUser,
} from '@/modules/dashboards/queries';

interface Props {
  userId: string;
}

export async function SeniorReviewerDashboard({ userId }: Props) {
  const supabase = await createClient();

  const [openCount, awaitingDecision, escalatedToMe, overdue, recent, avgDecisionHours, myEscalations] =
    await Promise.all([
      countCasesAssignedTo(supabase, userId, { openOnly: true }),
      countCasesAssignedToWithStatus(supabase, userId, ['in_review']),
      countCasesAssignedToWithStatus(supabase, userId, ['escalated']),
      countOverdueAssignedCases(supabase, userId, 5),
      getRecentDecisionsByUser(supabase, userId, 5),
      getAnalystAvgDecisionTime(supabase, userId),
      getEscalatedCasesByUser(supabase, userId, 5),
    ]);

  const avgDecisionLabel =
    avgDecisionHours == null
      ? '—'
      : avgDecisionHours < 1
        ? '<1h'
        : `${avgDecisionHours}h`;

  return (
    <DashboardShell
      title="My Review Queue"
      subtitle="Cases assigned to you, decisions and escalations"
      role={Role.SENIOR_REVIEWER}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Open Cases" value={openCount} href="/cases" />
        <StatCard
          label="Awaiting My Decision"
          value={awaitingDecision}
          href="/cases?status=in_review"
          urgent={awaitingDecision > 0}
        />
        <StatCard
          label="Escalated To Me"
          value={escalatedToMe}
          href="/cases?status=escalated"
          urgent={escalatedToMe > 0}
        />
        <StatCard
          label="Overdue (5+ days)"
          value={overdue}
          urgent={overdue > 0}
          hint="Open longer than 5 days"
        />
      </div>

      {/* Personal performance stat */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg Decision Time"
          value={avgDecisionLabel}
          hint={avgDecisionHours == null ? 'No completed decisions yet' : 'From assignment to decision'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {openCount === 0 ? (
          <EmptyState
            title="No cases assigned to you"
            body="Your queue is clear. Cases will appear here once assigned by an admin or MLRO."
          />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No decisions recorded yet"
            body="Recent approvals and rejections will appear here once you start reviewing cases."
          />
        ) : (
          <QueueSummary
            title="My recent decisions"
            rows={recent.map((r) => ({
              label: `Case ${r.case_id.slice(0, 8)}…`,
              value: r.decision,
              hint: new Date(r.decided_at).toLocaleString(),
              href: `/cases/${r.case_id}`,
            }))}
            emptyText="You have not recorded any decisions yet"
          />
        )}

        {/* Cases I escalated */}
        {myEscalations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cases I escalated</h3>
            <p className="text-sm text-gray-400">No escalations from you yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cases I escalated (top 5)</h3>
            <ul className="divide-y divide-gray-100">
              {myEscalations.map((row) => (
                <li key={row.caseId}>
                  <Link
                    href={`/cases/${row.caseId}`}
                    className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <span className="text-gray-900 font-mono text-xs">
                      {row.caseId.slice(0, 8)}…
                    </span>
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
