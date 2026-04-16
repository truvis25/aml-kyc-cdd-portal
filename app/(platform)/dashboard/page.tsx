import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants/roles';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect('/sign-in?error=session_invalid');
  }

  const claims = claimsData.claims as {
    role?: Role;
    tenant_id?: string;
  };

  const role = claims.role ?? 'unknown';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome to the TruVis AML / KYC / CDD Platform
        </p>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700 mb-8">
        <span className="capitalize">{role.replace(/_/g, ' ')}</span>
      </div>

      {/* Placeholder stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pending Cases', value: '–', description: 'Awaiting review' },
          { label: 'Active Sessions', value: '–', description: 'Onboarding in progress' },
          { label: 'Documents Pending', value: '–', description: 'Awaiting review' },
          { label: 'Screening Hits', value: '–', description: 'Unresolved hits' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Milestone 1 status notice */}
      <div className="mt-8 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm font-medium text-amber-900">Milestone 1 in progress</p>
        <p className="text-sm text-amber-700 mt-1">
          Foundation layer active: Auth, RBAC, Audit Trail, Tenant Setup.
          Onboarding, case management, and compliance modules are under construction.
        </p>
      </div>
    </div>
  );
}
