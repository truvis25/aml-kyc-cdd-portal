import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { StatCardWithSparkline } from './widgets/stat-card-with-sparkline';
import { QueueSummary } from './widgets/queue-summary';
import { CompletenessCard } from './widgets/completeness-card';
import { PeriodToggle, type Period } from './widgets/period-toggle';
import {
  countActiveSessions,
  countActiveUsersInTenant,
  countOpenCases,
  countSessionsSince,
  countUnassignedOpenCases,
  daysAgoIso,
  getActiveWorkflow,
  getTenantSetupCompleteness,
  getDailySessionVolume,
  startOfTodayIso,
  getPendingInvitationsCount,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
  /** Injected from the page's searchParams for the period toggle. */
  period?: Period;
}

export async function TenantAdminDashboard({ tenantId, period = 'week' }: Props) {
  const supabase = await createClient();

  // Volume since-cutoff driven by selected period
  const sincePeriod =
    period === 'today'
      ? startOfTodayIso()
      : period === 'month'
        ? daysAgoIso(30)
        : daysAgoIso(7);

  const [
    activeUsers,
    activeWorkflow,
    sessionsInPeriod,
    activeSessions,
    openCases,
    unassigned,
    completeness,
    dailySessions,
    pendingInvitations,
  ] = await Promise.all([
    countActiveUsersInTenant(supabase, tenantId),
    getActiveWorkflow(supabase, tenantId),
    countSessionsSince(supabase, tenantId, sincePeriod),
    countActiveSessions(supabase, tenantId),
    countOpenCases(supabase, tenantId),
    countUnassignedOpenCases(supabase, tenantId),
    getTenantSetupCompleteness(supabase, tenantId),
    getDailySessionVolume(supabase, tenantId, 30),
    getPendingInvitationsCount(supabase, tenantId),
  ]);

  const setupSignals = [
    {
      label: 'Active workflow published',
      done: completeness.signals.workflowActive,
      href: '/admin/workflows',
    },
    {
      label: 'Tenant configuration set',
      done: completeness.signals.configSet,
      href: '/admin/config',
    },
    {
      label: 'MLRO assigned',
      done: completeness.signals.mlroAssigned,
      href: '/admin/users',
    },
    {
      label: 'At least one analyst or reviewer',
      done: completeness.signals.reviewerOrAnalystAssigned,
      href: '/admin/users',
    },
  ];

  const periodLabel =
    period === 'today' ? 'today' : period === 'month' ? 'last 30 days' : 'last 7 days';

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

      {/* Outstanding invitations */}
      {pendingInvitations > 0 && (
        <div className="mt-4">
          <StatCard
            label="Outstanding Invitations"
            value={pendingInvitations}
            hint="Invitations not yet accepted"
            href="/admin/users"
            urgent={pendingInvitations > 0}
          />
        </div>
      )}

      {/* Volume section with period toggle + sparkline */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-700">Onboarding volume</h2>
        <PeriodToggle activePeriod={period} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardWithSparkline
          label={`Sessions — ${periodLabel}`}
          value={sessionsInPeriod}
          trend={dailySessions}
          trendColor="#3b82f6"
          filled
        />
        <StatCard
          label="Active right now"
          value={activeSessions}
          hint="Onboarding in progress"
        />
        <StatCard
          label="Unassigned cases"
          value={unassigned}
          hint={unassigned > 0 ? 'Needs assignment' : 'All assigned'}
          href={unassigned > 0 ? '/cases?status=open' : undefined}
          urgent={unassigned > 0}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CompletenessCard
          title="Setup completeness"
          percent={completeness.percent}
          completed={completeness.completed}
          total={completeness.total}
          signals={setupSignals}
        />
        <QueueSummary
          title="Quick actions"
          rows={[
            {
              label: 'Outstanding invitations',
              value: pendingInvitations,
              hint: pendingInvitations > 0 ? 'Pending acceptance' : 'None pending',
              href: '/admin/users',
            },
            { label: 'Invite a user', value: '→', href: '/admin/users' },
            { label: 'Manage configuration', value: '→', href: '/admin/config' },
            { label: 'Review open cases', value: openCases, href: '/cases?status=open' },
            { label: 'Audit trail', value: '→', href: '/audit' },
          ]}
        />
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Onboarding completeness</h3>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${completeness.percent}%` }}
              aria-label={`${completeness.percent}% complete`}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {completeness.completed} of {completeness.total} setup steps done
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
