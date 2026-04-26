import { hasPermission } from '@/modules/auth/rbac';
import { UsersAccessManagement } from '@/components/admin/users-access-management';
import { getPageAuth } from '@/lib/auth/page-auth';

export default async function UsersPage() {
  const { role } = await getPageAuth();

  if (!hasPermission(role, 'admin:manage_users')) {
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
