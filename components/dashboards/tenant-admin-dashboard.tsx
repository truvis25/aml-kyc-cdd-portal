import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import {
  countActiveSessions,
  countActiveUsersInTenant,
  countOpenCases,
  countSessionsSince,
  countUnassignedOpenCases,
  daysAgoIso,
  getActiveWorkflow,
  startOfTodayIso,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
}

export async function TenantAdminDashboard({ tenantId }: Props) {
  const supabase = await createClient();

  const [
    activeUsers,
    activeWorkflow,
    sessionsToday,
    sessionsWeek,
    sessionsMonth,
    activeSessions,
    openCases,
    unassigned,
  ] = await Promise.all([
    countActiveUsersInTenant(supabase, tenantId),
    getActiveWorkflow(supabase, tenantId),
    countSessionsSince(supabase, tenantId, startOfTodayIso()),
    countSessionsSince(supabase, tenantId, daysAgoIso(7)),
    countSessionsSince(supabase, tenantId, daysAgoIso(30)),
    countActiveSessions(supabase, tenantId),
    countOpenCases(supabase, tenantId),
    countUnassignedOpenCases(supabase, tenantId),
  ]);

  return (
    <DashboardShell
      title="Tenant Operations"
      subtitle="Team, workflows, onboarding volume and case health"
      role={Role.TENANT_ADMIN}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Users" value={activeUsers} hint="In this tenant" href="/admin/users" />
        <StatCard
          label="Active Workflow"
          value={activeWorkflow ? `v${activeWorkflow.version}` : '—'}
          hint={activeWorkflow ? activeWorkflow.name : 'No workflow active'}
          href="/admin/workflows"
          urgent={!activeWorkflow}
        />
        <StatCard label="Active Sessions" value={activeSessions} hint="Onboarding in progress" />
        <StatCard
          label="Open Cases"
          value={openCases}
          hint={unassigned > 0 ? `${unassigned} unassigned` : 'All assigned'}
          href="/cases?status=open"
          urgent={unassigned > 0}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QueueSummary
          title="Onboarding volume"
          rows={[
            { label: 'Today', value: sessionsToday },
            { label: 'Last 7 days', value: sessionsWeek },
            { label: 'Last 30 days', value: sessionsMonth },
          ]}
        />
        <QueueSummary
          title="Quick actions"
          rows={[
            { label: 'Invite a user', value: '→', href: '/admin/users' },
            { label: 'Manage configuration', value: '→', href: '/admin/config' },
            { label: 'Review open cases', value: openCases, href: '/cases?status=open' },
            { label: 'Audit trail', value: '→', href: '/audit' },
          ]}
        />
      </div>
    </DashboardShell>
  );
}
