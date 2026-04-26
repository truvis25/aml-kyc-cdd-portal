import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants/roles';
import { hasPermission } from '@/modules/auth/rbac';
import { UsersAccessManagement } from '@/components/admin/users-access-management';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect('/sign-in?error=session_invalid');
  }

  const claims = claimsData.claims as { user_role?: Role; tenant_id?: string };
  const role = claims.user_role;

  if (!role || !hasPermission(role, 'admin:manage_users')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">
          You do not have permission to manage users.
        </p>
      </div>
    );
  }

  return <UsersAccessManagement />;
}
