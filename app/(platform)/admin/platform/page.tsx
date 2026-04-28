import Link from 'next/link';
import { Role } from '@/lib/constants/roles';
import { getPageAuth } from '@/lib/auth/page-auth';
import { PlatformAdminDashboard } from '@/components/dashboards/platform-admin-dashboard';

/**
 * /admin/platform — landing route for platform_super_admin per
 * `docs/ROLES_DASHBOARDS_FLOWS.md` §13. Renders the existing
 * `PlatformAdminDashboard` composition; any role other than
 * platform_super_admin gets a friendly access-denied screen since the
 * widgets here are platform-governance scoped.
 *
 * Note: cross-tenant aggregates still require an RLS bypass policy
 * (flagged in the dashboard component itself); this route exists so the
 * "Platform Admin" sidebar entry has somewhere to land.
 */
export default async function PlatformAdminPage() {
  const { role, tenantId } = await getPageAuth();

  if (role !== Role.PLATFORM_SUPER_ADMIN) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Platform admin only</p>
        <p className="text-sm text-red-700 mt-1">
          This area is restricted to TruVis platform super admins. If you reached this
          page by mistake, return to the{' '}
          <Link href="/dashboard" className="underline font-medium">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  return <PlatformAdminDashboard tenantId={tenantId} />;
}
