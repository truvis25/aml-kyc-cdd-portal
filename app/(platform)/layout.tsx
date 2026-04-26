import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformShell } from '@/components/shared/platform-shell';
import type { Role } from '@/lib/constants/roles';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Validate the user against the Supabase Auth server (not just the cookie)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/sign-in');
  }

  // Read custom claims from the JWT (injected by custom_access_token_hook)
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = (claimsData?.claims ?? {}) as {
    tenant_id?: string;
    user_role?: Role;
    mfa_verified?: boolean;
  };

  // If JWT hook hasn't enriched this token yet, fall back to looking up the
  // user directly in the database so the page still renders.
  let tenantId = claims.tenant_id;
  let role = claims.user_role;

  if (!tenantId || !role) {
    // Fallback: query the users/user_roles tables directly
    const { data: userRow } = await supabase
      .from('users')
      .select('tenant_id, user_roles(roles(name))')
      .eq('id', user.id)
      .single();

    if (!userRow) {
      // Genuine auth failure — user record doesn't exist
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

  return (
    <PlatformShell
      userId={user.id}
      email={user.email ?? ''}
      role={role}
      tenantId={tenantId}
    >
      {children}
    </PlatformShell>
  );
}
