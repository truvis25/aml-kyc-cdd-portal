import { getPageAuth } from '@/lib/auth/page-auth';
import { Role } from '@/lib/constants/roles';
import { PlatformAdminDashboard } from '@/components/dashboards/platform-admin-dashboard';
import { TenantAdminDashboard } from '@/components/dashboards/tenant-admin-dashboard';
import { MLRODashboard } from '@/components/dashboards/mlro-dashboard';
import { SeniorReviewerDashboard } from '@/components/dashboards/senior-reviewer-dashboard';
import { AnalystDashboard } from '@/components/dashboards/analyst-dashboard';
import { OnboardingAgentDashboard } from '@/components/dashboards/onboarding-agent-dashboard';
import { ReadOnlyDashboard } from '@/components/dashboards/read-only-dashboard';

export default async function DashboardPage() {
  const { userId, role, tenantId } = await getPageAuth();

  switch (role) {
    case Role.PLATFORM_SUPER_ADMIN:
      return <PlatformAdminDashboard tenantId={tenantId} />;
    case Role.TENANT_ADMIN:
      return <TenantAdminDashboard tenantId={tenantId} />;
    case Role.MLRO:
      return <MLRODashboard userId={userId} tenantId={tenantId} />;
    case Role.SENIOR_REVIEWER:
      return <SeniorReviewerDashboard userId={userId} />;
    case Role.ANALYST:
      return <AnalystDashboard userId={userId} />;
    case Role.ONBOARDING_AGENT:
      return <OnboardingAgentDashboard tenantId={tenantId} />;
    case Role.READ_ONLY:
      return <ReadOnlyDashboard tenantId={tenantId} />;
    default:
      return null;
  }
}
