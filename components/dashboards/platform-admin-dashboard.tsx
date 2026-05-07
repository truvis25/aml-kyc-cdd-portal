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
  getCrossTenantHealth,
  getWebhookDeliveryRate,
  type CrossTenantHealthRow,
} from '@/modules/dashboards/queries';

interface Props {
  tenantId: string;
}

function formatLastActivity(iso: string | null): string {
  if (!iso) return '—';
  const minutesAgo = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60));
  if (minutesAgo < 2) return 'just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

interface CrossTenantTableProps {
  rows: CrossTenantHealthRow[];
}

function CrossTenantHealthTable({ rows }: CrossTenantTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cross-tenant health</h3>
        <p className="text-sm text-gray-400">No active tenants found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Cross-tenant health</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500">Tenant</th>
            <th className="py-2 pr-4 text-right text-xs font-medium text-gray-500">Open Cases</th>
            <th className="py-2 pr-4 text-right text-xs font-medium text-gray-500">
              Sessions Today
            </th>
            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500">
              Last Activity
            </th>
            <th className="py-2 text-right text-xs font-medium text-gray-500">Queue Depth</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.tenantId} className="hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-900 font-medium">{row.tenantName}</td>
              <td
                className={`py-2 pr-4 text-right tabular-nums ${row.openCases > 0 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}
              >
                {row.openCases}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                {row.sessionsToday}
              </td>
              <td className="py-2 pr-4 text-gray-500 text-xs">
                {formatLastActivity(row.lastActivity)}
              </td>
              <td
                className={`py-2 text-right tabular-nums ${row.queueDepth > 0 ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}
              >
                {row.queueDepth}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function PlatformAdminDashboard({ tenantId }: Props) {
  // AUTH: platform_super_admin route — session validated by middleware before this renders
  const supabase = await createClient();

  const { data: tenantRow } = await supabase
    .from('tenants')
    .select('id, name, slug, status, created_at')
    .eq('id', tenantId)
    .single();
  const tenant = tenantRow as
    | { id: string; name: string; slug: string; status: string; created_at: string }
    | null;

  const [users, sessions, cases, slug, completeness, crossTenantHealth, webhookRate24h] =
    await Promise.all([
      countActiveUsersInTenant(supabase, tenantId),
      countActiveSessions(supabase, tenantId),
      countOpenCases(supabase, tenantId),
      getTenantSlug(supabase, tenantId),
      getTenantSetupCompleteness(supabase, tenantId),
      getCrossTenantHealth(supabase),
      getWebhookDeliveryRate(supabase, tenantId, 24),
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

  const webhookHint =
    webhookRate24h.total > 0
      ? `${webhookRate24h.total} events in 24h`
      : 'No webhook events in 24h';

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

      {/* Webhook delivery rate card */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Webhook Delivery (24h)"
          value={`${webhookRate24h.successRate}%`}
          hint={webhookHint}
          urgent={webhookRate24h.successRate < 90 && webhookRate24h.total > 0}
        />
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
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Platform info</p>
          <p className="text-xs text-gray-500">
            Viewing tenant:{' '}
            <span className="font-medium text-gray-700">{tenant?.name ?? '—'}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Cross-tenant aggregates are derived from the tenants table accessible to
            platform_super_admin.
          </p>
        </div>
      </div>

      {/* Cross-tenant health table */}
      <div className="mt-6">
        <CrossTenantHealthTable rows={crossTenantHealth} />
      </div>
    </DashboardShell>
  );
}
