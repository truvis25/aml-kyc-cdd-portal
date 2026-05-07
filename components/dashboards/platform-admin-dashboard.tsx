import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import { CompletenessCard } from './widgets/completeness-card';
import {
  countActiveSessions,
  countActiveUsersInTenant,
  countOpenCases,
  getTenantSlug,
  getTenantSetupCompleteness,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
}

export async function PlatformAdminDashboard({ tenantId }: Props) {
  const supabase = await createClient();

  const { data: tenantRow } = await supabase
    .from('tenants')
    .select('id, name, slug, status, created_at')
    .eq('id', tenantId)
    .single();
  const tenant = tenantRow as
    | { id: string; name: string; slug: string; status: string; created_at: string }
    | null;

  const [users, sessions, cases, slug, completeness] = await Promise.all([
    countActiveUsersInTenant(supabase, tenantId),
    countActiveSessions(supabase, tenantId),
    countOpenCases(supabase, tenantId),
    getTenantSlug(supabase, tenantId),
    getTenantSetupCompleteness(supabase, tenantId),
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
      label: 'Analyst or reviewer assigned',
      done: completeness.signals.reviewerOrAnalystAssigned,
      href: '/admin/users',
    },
  ];

  return (
    <DashboardShell
      title="Platform Administration"
      subtitle="Tenant health and governance"
      role={Role.PLATFORM_SUPER_ADMIN}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tenant" value={tenant?.name ?? '—'} hint={slug ?? ''} />
        <StatCard label="Status" value={tenant?.status ?? '—'} />
        <StatCard label="Active Users" value={users} href="/admin/users" />
        <StatCard label="Open Cases" value={cases} hint={`${sessions} active sessions`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueSummary
          title="System governance"
          rows={[
            { label: 'Audit trail', value: '→', href: '/audit' },
            { label: 'Tenant configuration', value: '→', href: '/admin/config' },
            { label: 'Workflows', value: '→', href: '/admin/workflows' },
            { label: 'Users', value: users, href: '/admin/users' },
          ]}
        />
        <CompletenessCard
          title="Tenant setup completeness"
          percent={completeness.percent}
          completed={completeness.completed}
          total={completeness.total}
          signals={setupSignals}
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold mb-1">Cross-tenant view pending</p>
          <p className="text-amber-800">
            Platform-wide aggregates across all tenants require a dedicated RLS bypass policy
            for <code className="font-mono text-xs">platform_super_admin</code>. Tracked as a
            Phase 2 hardening item; for now this dashboard reflects the tenant assigned to your
            account.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
