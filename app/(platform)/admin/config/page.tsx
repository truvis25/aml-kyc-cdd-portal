import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';
import { TenantConfigClient } from '@/components/admin/tenant-config-client';
import { TenantConfigForm } from '@/components/admin/tenant-config-form';
import { getLatestTenantConfig } from '@/modules/admin-config/admin-config.service';

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

  // Build absolute onboarding URL from the current request host
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const onboardingUrl = `${proto}://${host}/${tenant?.slug ?? ''}/onboard`;

  const canEdit = hasPermission(role, 'admin:manage_config');

  const tenantConfigRow = await getLatestTenantConfig(tenant_id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Tenant settings and platform configuration</p>
      </div>

      <div className="space-y-6">
        <TenantConfigClient
          tenantId={tenant_id}
          initialName={tenant?.name ?? ''}
          slug={tenant?.slug ?? ''}
          onboardingUrl={onboardingUrl}
          canEdit={canEdit}
        />

        <TenantConfigForm
          initial={tenantConfigRow.config}
          initialVersion={tenantConfigRow.version}
          canEdit={canEdit}
        />

        {/* Additional metadata */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Platform Details</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</p>
                <p className="mt-1 font-mono text-gray-500 text-xs">{tenant_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                <p className="mt-1 text-gray-900">
                  {tenant?.created_at ? new Date(tenant.created_at as string).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
