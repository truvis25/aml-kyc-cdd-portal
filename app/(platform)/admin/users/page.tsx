import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants/roles';
import { hasPermission } from '@/modules/auth/rbac';
import { InviteUserForm } from '@/components/admin/invite-user-form';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const claims = user.app_metadata as { role?: Role; tenant_id?: string };
  const role = claims.role;

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

  // Fetch users for this tenant
  const { data: usersData } = await supabase
    .from('users')
    .select('id, display_name, status, created_at')
    .eq('tenant_id', claims.tenant_id!)
    .order('created_at', { ascending: false });

  // Fetch active user_roles with role names separately
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('user_id, revoked_at, role_id')
    .eq('tenant_id', claims.tenant_id!)
    .is('revoked_at', null);

  const { data: rolesData } = await supabase
    .from('roles')
    .select('id, name');

  // Build a lookup of user_id → role name
  const roleMap = new Map(rolesData?.map((r) => [r.id, r.name]) ?? []);
  const userRoleMap = new Map(
    userRolesData?.map((ur) => [ur.user_id, roleMap.get(ur.role_id) ?? null]) ?? []
  );

  const users = usersData?.map((u) => ({
    ...u,
    role_name: userRoleMap.get(u.id) ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform users and role assignments for your organisation.
          </p>
        </div>
        <InviteUserForm />
      </div>

      {/* Users table */}
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Role', 'Status', 'Joined'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No users yet. Invite the first user to get started.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {u.display_name ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                      {u.role_name?.replace(/_/g, ' ') ?? 'No role'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize
                      ${u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
