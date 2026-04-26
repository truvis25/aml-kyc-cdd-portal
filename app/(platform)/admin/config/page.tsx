import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';

export default async function AdminConfigPage() {
  const { role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  if (!hasPermission(role, 'admin:manage_config')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">You do not have permission to manage configuration.</p>
      </div>
    );
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, created_at')
    .eq('id', tenant_id)
    .single();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Tenant settings and platform configuration</p>
      </div>

      <div className="space-y-6">
        {/* Tenant Info */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Tenant Details</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                <p className="mt-1 text-sm text-gray-900">{tenant?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</p>
                <p className="mt-1 text-sm font-mono text-gray-900">{tenant?.slug ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</p>
                <p className="mt-1 text-sm font-mono text-gray-500">{tenant_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                <p className="mt-1 text-sm text-gray-900">
                  {tenant?.created_at ? new Date(tenant.created_at as string).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Link */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Customer Onboarding</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500 mb-3">
              Share this link with customers to start their KYC/KYB onboarding process.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700">
                /{tenant?.slug ?? '...'}/onboard
              </code>
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-6 text-center">
          <p className="text-sm font-medium text-gray-600">Additional configuration options coming soon</p>
          <p className="text-xs text-gray-400 mt-1">Risk thresholds, notification settings, workflow rules</p>
        </div>
      </div>
    </div>
  );
}
