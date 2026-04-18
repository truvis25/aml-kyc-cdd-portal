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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/sign-in');
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect('/sign-in?error=session_invalid');
  }

  const claims = claimsData.claims as {
    tenant_id?: string;
    role?: Role;
    mfa_verified?: boolean;
  };

  if (!claims.tenant_id || !claims.role) {
    // JWT not yet enriched — force re-auth
    redirect('/sign-in?error=session_invalid');
  }

  return (
    <PlatformShell
      userId={user.id}
      email={user.email ?? ''}
      role={claims.role}
      tenantId={claims.tenant_id}
    >
      {children}
    </PlatformShell>
  );
}
