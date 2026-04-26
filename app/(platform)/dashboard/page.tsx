import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getPageAuth } from '@/lib/auth/page-auth';
import { hasPermission } from '@/modules/auth/rbac';

export default async function DashboardPage() {
  const { role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  let openCases = 0;
  let unassignedCases = 0;
  let activeSessions = 0;
  let pendingDocs = 0;
  let unresolvedHits = 0;
  let tenantSlug: string | null = null;

  if (tenant_id) {
    const [openResult, unassignedResult, sessionsResult, docsResult, hitsResult, tenantResult] = await Promise.all([
      supabase.from('cases').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'open'),
      supabase.from('cases').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'open').is('assigned_to', null),
      supabase.from('onboarding_sessions').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'in_progress'),
      supabase.from('documents').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'uploaded'),
      supabase.from('screening_hits').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'pending'),
      supabase.from('tenants').select('slug').eq('id', tenant_id).single(),
    ]);
    openCases = openResult.count ?? 0;
    unassignedCases = unassignedResult.count ?? 0;
    activeSessions = sessionsResult.count ?? 0;
    pendingDocs = docsResult.count ?? 0;
    unresolvedHits = hitsResult.count ?? 0;
    tenantSlug = (tenantResult.data as { slug?: string } | null)?.slug ?? null;
  }

  const canStartOnboarding = hasPermission(role, 'onboarding:create');
  const canViewCases = hasPermission(role, 'cases:read_all') || hasPermission(role, 'cases:read_assigned');
  const canViewAudit = hasPermission(role, 'audit:read');

  const stats = [
    {
      label: 'Open Cases',
      value: openCases,
      description: unassignedCases > 0 ? `${unassignedCases} unassigned` : 'All assigned',
      href: '/cases?status=open',
      urgent: unassignedCases > 0,
      show: canViewCases,
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      description: 'Onboarding in progress',
      href: null,
      urgent: false,
      show: true,
    },
    {
      label: 'Documents Pending',
      value: pendingDocs,
      description: 'Awaiting verification',
      href: '/cases?status=open',
      urgent: pendingDocs > 0,
      show: canViewCases,
    },
    {
      label: 'Screening Hits',
      value: unresolvedHits,
      description: 'Unresolved hits',
      href: '/cases?status=open',
      urgent: unresolvedHits > 0,
      show: canViewCases,
    },
  ].filter((s) => s.show);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">TruVis AML / KYC / CDD Platform</p>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700 mb-8">
        <span className="capitalize">{role.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const inner = (
            <div
              key={stat.label}
              className={`rounded-lg bg-white border p-5 shadow-sm transition-colors ${
                stat.href ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
              } ${stat.urgent ? 'border-orange-200' : 'border-gray-200'}`}
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className={`mt-1 text-3xl font-semibold ${stat.urgent && stat.value > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className={`mt-1 text-xs ${stat.urgent && stat.value > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                {stat.description}
              </p>
              {stat.href && (
                <p className="mt-2 text-xs text-blue-600">View →</p>
              )}
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canStartOnboarding && tenantSlug && (
            <Link
              href={`/${tenantSlug}/onboard`}
              className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New Onboarding</p>
                <p className="text-xs text-gray-500 mt-0.5">Start KYC or KYB application</p>
              </div>
            </Link>
          )}
          {canViewCases && (
            <Link
              href="/cases"
              className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Review Cases</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {openCases} open · {unassignedCases} unassigned
                </p>
              </div>
            </Link>
          )}
          {canViewAudit && (
            <Link
              href="/audit"
              className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Audit Trail</p>
                <p className="text-xs text-gray-500 mt-0.5">Compliance activity log</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
