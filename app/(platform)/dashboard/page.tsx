import { getPageAuth } from '@/lib/auth/page-auth';
import { Role } from '@/lib/constants/roles';
import { PlatformAdminDashboard } from '@/components/dashboards/platform-admin-dashboard';
import { TenantAdminDashboard } from '@/components/dashboards/tenant-admin-dashboard';
import { MLRODashboard } from '@/components/dashboards/mlro-dashboard';
import { SeniorReviewerDashboard } from '@/components/dashboards/senior-reviewer-dashboard';
import { AnalystDashboard } from '@/components/dashboards/analyst-dashboard';
import { OnboardingAgentDashboard } from '@/components/dashboards/onboarding-agent-dashboard';
import { ReadOnlyDashboard } from '@/components/dashboards/read-only-dashboard';
import type { Period } from '@/components/dashboards/widgets/period-toggle';
import type { ReadOnlyRange } from '@/components/dashboards/widgets/range-selector-client';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getPeriod(raw: string | string[] | undefined): Period {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'today' || v === 'month') return v;
  return 'week';
}

function getRange(raw: string | string[] | undefined): ReadOnlyRange {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === '90d' || v === 'ytd') return v;
  return '30d';
}

export default async function DashboardPage({ searchParams }: Props) {
  const { userId, role, tenantId } = await getPageAuth();
  const params = await searchParams;
  const period = getPeriod(params['period']);
  const range = getRange(params['range']);

  switch (role) {
    case Role.PLATFORM_SUPER_ADMIN:
      return <PlatformAdminDashboard tenantId={tenantId} />;
    case Role.TENANT_ADMIN:
      return <TenantAdminDashboard tenantId={tenantId} period={period} />;
    case Role.MLRO:
      return <MLRODashboard userId={userId} tenantId={tenantId} />;
    case Role.SENIOR_REVIEWER:
      return <SeniorReviewerDashboard userId={userId} />;
    case Role.ANALYST:
      return <AnalystDashboard userId={userId} />;
    case Role.ONBOARDING_AGENT:
      return <OnboardingAgentDashboard tenantId={tenantId} period={period} />;
    case Role.READ_ONLY:
      return <ReadOnlyDashboard tenantId={tenantId} range={range} />;
    default:
      return null;
  }
}
