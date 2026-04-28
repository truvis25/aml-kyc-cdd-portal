import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import {
  countActiveSessions,
  countSessionsSince,
  countStuckSessions,
  getTenantSlug,
  startOfTodayIso,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
}

export async function OnboardingAgentDashboard({ tenantId }: Props) {
  const supabase = await createClient();

  const [active, completedToday, stuck, slug] = await Promise.all([
    countActiveSessions(supabase, tenantId),
    countSessionsSince(supabase, tenantId, startOfTodayIso()),
    countStuckSessions(supabase, tenantId, 48),
    getTenantSlug(supabase, tenantId),
  ]);

  return (
    <DashboardShell
      title="Onboarding Sessions"
      subtitle="Start new applications and track in-progress sessions"
      role={Role.ONBOARDING_AGENT}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Sessions" value={active} hint="In progress" />
        <StatCard label="Started Today" value={completedToday} />
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
        <QueueSummary
          title="Quick actions"
          rows={[
            ...(slug
              ? [
                  {
                    label: 'New individual KYC',
                    value: '→',
                    href: `/${slug}/onboard`,
                  },
                  {
                    label: 'New corporate KYB',
                    value: '→',
                    href: `/${slug}/onboard`,
                  },
                ]
              : []),
          ]}
          emptyText="Tenant slug not configured — contact admin"
        />
      </div>
    </DashboardShell>
  );
}
