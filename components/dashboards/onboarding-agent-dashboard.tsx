import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import { PeriodToggle, type Period } from './widgets/period-toggle';
import {
  countActiveSessions,
  countSessionsSince,
  countStuckSessions,
  getDailySessionVolume,
  getTenantSlug,
  daysAgoIso,
  startOfTodayIso,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
  period?: Period;
}

export async function OnboardingAgentDashboard({ tenantId, period = 'today' }: Props) {
  const supabase = await createClient();

  const sincePeriod =
    period === 'month'
      ? daysAgoIso(30)
      : period === 'week'
        ? daysAgoIso(7)
        : startOfTodayIso();

  const [active, sessionsInPeriod, stuck, slug, dailySessions] = await Promise.all([
    countActiveSessions(supabase, tenantId),
    countSessionsSince(supabase, tenantId, sincePeriod),
    countStuckSessions(supabase, tenantId, 48),
    getTenantSlug(supabase, tenantId),
    getDailySessionVolume(supabase, tenantId, 30),
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

      <div className="mt-6">
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
