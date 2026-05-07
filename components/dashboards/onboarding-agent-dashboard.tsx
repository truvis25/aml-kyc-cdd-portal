import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import { PeriodToggle, type Period } from './widgets/period-toggle';
import { CustomerSearchClient } from './widgets/customer-search-client';
import {
  countActiveSessions,
  countSessionsSince,
  countStuckSessions,
  getDailySessionVolume,
  getTenantSlug,
  daysAgoIso,
  startOfTodayIso,
  getInProgressSessions,
  type InProgressSessionRow,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
  period?: Period;
}

function formatUpdatedAt(iso: string): string {
  const minutesAgo = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60));
  if (minutesAgo < 2) return 'active now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

interface ResumeSessionListProps {
  sessions: InProgressSessionRow[];
}

function ResumeSessionList({ sessions }: ResumeSessionListProps) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400">No in-progress sessions.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {sessions.map((s) => (
        <li key={s.sessionId}>
          <Link
            href={`/onboarding/${s.sessionId}/resume`}
            className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 -mx-2 px-2 rounded"
          >
            <div>
              <p className="text-gray-900 font-mono text-xs">{s.sessionId.slice(0, 8)}…</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatUpdatedAt(s.updatedAt)}</p>
            </div>
            <span className="text-xs font-medium text-blue-600">Resume →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function OnboardingAgentDashboard({ tenantId, period = 'today' }: Props) {
  const supabase = await createClient();

  const sincePeriod =
    period === 'month'
      ? daysAgoIso(30)
      : period === 'week'
        ? daysAgoIso(7)
        : startOfTodayIso();

  const [active, sessionsInPeriod, stuck, slug, dailySessions, inProgressSessions] =
    await Promise.all([
      countActiveSessions(supabase, tenantId),
      countSessionsSince(supabase, tenantId, sincePeriod),
      countStuckSessions(supabase, tenantId, 48),
      getTenantSlug(supabase, tenantId),
      getDailySessionVolume(supabase, tenantId, 30),
      getInProgressSessions(supabase, tenantId, 5),
    ]);

  const periodLabel =
    period === 'today' ? 'today' : period === 'month' ? 'last 30 days' : 'last 7 days';

  return (
    <DashboardShell
      title="Onboarding Sessions"
      subtitle="Start new applications and track in-progress sessions"
      role={Role.ONBOARDING_AGENT}
    >
      <div className="mt-2 flex items-center justify-end">
        <PeriodToggle activePeriod={period} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Sessions" value={active} hint="In progress" />
        <StatCardWithSparkline
          label={`Sessions — ${periodLabel}`}
          value={sessionsInPeriod}
          trend={dailySessions}
          trendColor="#3b82f6"
          filled
        />
        <StatCard
          label="Stuck Sessions"
          value={stuck}
          hint="Paused longer than 48h"
          urgent={stuck > 0}
        />
        <StatCard
          label="New Onboarding"
          value="→"
          hint="Start KYC or KYB"
          href={slug ? `/${slug}/onboard` : undefined}
        />
      </div>

      {/* Customer search */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Customer lookup</h2>
        <CustomerSearchClient placeholder="Search by case ID or reference…" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Resume session list */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Resume in-progress sessions (top 5)
          </h3>
          <ResumeSessionList sessions={inProgressSessions} />
        </div>

        {slug ? (
          <QueueSummary
            title="Quick actions"
            rows={[
              { label: 'New individual KYC', value: '→', href: `/${slug}/onboard` },
              { label: 'New corporate KYB', value: '→', href: `/${slug}/onboard` },
            ]}
          />
        ) : (
          <EmptyState
            title="Tenant not fully configured"
            body="Ask your admin to configure the tenant slug before starting new onboardings."
          />
        )}
      </div>
    </DashboardShell>
  );
}
