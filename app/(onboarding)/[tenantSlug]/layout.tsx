import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getLatestTenantConfig } from '@/modules/admin-config/admin-config.service';

interface Props {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantOnboardingLayout({ children, params }: Props) {
  const { tenantSlug } = await params;

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', tenantSlug)
    .maybeSingle();

  let displayName: string | null = null;
  let logoUrl: string | null = null;
  if (tenant) {
    const cfg = await getLatestTenantConfig((tenant as { id: string }).id);
    displayName = cfg.config.branding.company_name ?? (tenant as { name: string }).name;
    logoUrl = cfg.config.branding.logo_url;
  }

  return (
    <div>
      {(logoUrl || displayName) && (
        <header className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-3xl flex items-center gap-3 px-4 py-3">
            {logoUrl && (
              // Customer-facing public page; remote logo URL is stored via the
              // admin config flow which only accepts upserts to our public
              // bucket. eslint-disable: <img> is appropriate here because the
              // logo origin varies per tenant and Next/Image config would
              // require allowlisting every Supabase project URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />
            )}
            {displayName && (
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
            )}
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
