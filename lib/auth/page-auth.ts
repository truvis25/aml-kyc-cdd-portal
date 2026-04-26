import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/constants/roles';

export interface PageAuth {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
}

/**
 * Server-side auth helper for platform page components.
 *
 * Mirrors the JWT-enrichment fallback in the platform layout:
 * tries JWT claims first, then falls back to a direct DB lookup
 * so pages continue to work during token-refresh windows when the
 * custom_access_token_hook hasn't yet re-enriched the new token.
 *
 * Calls redirect() internally — never returns on auth failure.
 */
export async function getPageAuth(): Promise<PageAuth> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/sign-in');
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = (claimsData?.claims ?? {}) as {
    tenant_id?: string;
    user_role?: Role;
  };

  let tenantId = claims.tenant_id;
  let role = claims.user_role;

  if (!tenantId || !role) {
    const { data: userRow } = await supabase
      .from('users')
      .select('tenant_id, user_roles(roles(name))')
      .eq('id', user.id)
      .single();

    if (!userRow) {
      redirect('/sign-in?error=session_invalid');
    }

    tenantId = (userRow as { tenant_id: string }).tenant_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleRows = (userRow as any).user_roles;
    role = Array.isArray(roleRows) && roleRows.length > 0
      ? roleRows[0]?.roles?.name as Role
      : undefined;

    if (!tenantId || !role) {
      redirect('/sign-in?error=session_invalid');
    }
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    role: role as Role,
    tenantId: tenantId as string,
  };
}
