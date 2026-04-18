import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Role } from '@/lib/constants/roles';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect('/sign-in?error=session_invalid');
  }

  const claims = claimsData.claims as { role?: Role; tenant_id?: string };
  const role = claims.role ?? 'unknown';
  const tenant_id = claims.tenant_id;

  // Fetch stats if we have a tenant context
  let pendingCases = 0;
  let activeSessions = 0;
  let pendingDocs = 0;
  let unresolvedHits = 0;

  if (tenant_id) {
    const [casesResult, sessionsResult, docsResult, hitsResult] = await Promise.all([
      supabase.from('cases').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'open'),
      supabase.from('onboarding_sessions').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'in_progress'),
      supabase.from('documents').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'uploaded'),
      supabase.from('screening_hits').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id).eq('status', 'pending'),
    ]);
    pendingCases = casesResult.count ?? 0;
    activeSessions = sessionsResult.count ?? 0;
    pendingDocs = docsResult.count ?? 0;
    unresolvedHits = hitsResult.count ?? 0;
  }

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
        {[
          {
            label: 'Pending Cases',
            value: pendingCases,
            description: 'Awaiting review',
            href: '/cases?status=open',
          },
          {
            label: 'Active Sessions',
            value: activeSessions,
            description: 'Onboarding in progress',
            href: null,
          },
          {
            label: 'Documents Pending',
            value: pendingDocs,
            description: 'Awaiting verification',
            href: null,
          },
          {
            label: 'Screening Hits',
            value: unresolvedHits,
            description: 'Unresolved hits',
            href: null,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.description}</p>
            {stat.href && stat.value > 0 && (
              <Link href={stat.href} className="mt-2 block text-xs text-blue-600 hover:underline">
                View cases →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
