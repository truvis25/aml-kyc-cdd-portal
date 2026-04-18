'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InviteUserForm } from '@/components/admin/invite-user-form';
import type { ListManagedUsersResult, ManagedUserRecord } from '@/modules/admin-users/admin-users.types';
import type { Role } from '@/lib/constants/roles';

const PROVISIONING_LABELS: Record<ManagedUserRecord['provisioning_status'], string> = {
  complete: 'Complete',
  missing_app_user: 'Missing app user record',
  missing_tenant: 'Missing tenant assignment',
  missing_role: 'Missing active role',
  missing_auth: 'Missing auth user',
};

const AUTH_LABELS: Record<ManagedUserRecord['auth_status'], string> = {
  active: 'Active',
  invited: 'Invited',
  missing_auth: 'Missing auth',
};

function badgeClass(kind: 'good' | 'warn' | 'bad' | 'neutral') {
  if (kind === 'good') return 'bg-green-50 text-green-700';
  if (kind === 'warn') return 'bg-amber-50 text-amber-700';
  if (kind === 'bad') return 'bg-red-50 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export function UsersAccessManagement() {
  const [data, setData] = useState<ListManagedUsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [roleSelections, setRoleSelections] = useState<Record<string, Role>>({});
  const [tenantSelections, setTenantSelections] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error ?? 'Failed to load users.');
      setLoading(false);
      return;
    }

    setData(payload as ListManagedUsersResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const users = data?.users ?? [];
  const roles = data?.roles ?? [];
  const tenants = data?.tenants ?? [];
  const canManageCrossTenant = data?.can_manage_cross_tenant ?? false;

  useEffect(() => {
    if (!data) return;
    const nextRoles: Record<string, Role> = {};
    const nextTenants: Record<string, string> = {};
    data.users.forEach((user) => {
      if (user.active_role) nextRoles[user.id] = user.active_role;
      else if (roles[0]) nextRoles[user.id] = roles[0].name;

      const defaultTenant = user.tenant?.id ?? tenants[0]?.id;
      if (defaultTenant) nextTenants[user.id] = defaultTenant;
    });
    setRoleSelections(nextRoles);
    setTenantSelections(nextTenants);
  }, [data, roles, tenants]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  async function runAction(userId: string, body: Record<string, unknown>, successMessage: string) {
    setPendingAction(userId);
    setError(null);
    setNotice(null);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error ?? 'Action failed.');
      setPendingAction(null);
      return;
    }

    setNotice(payload.message ?? successMessage);
    await loadUsers();
    setPendingAction(null);
  }

  if (loading) {
    return <div className="rounded-lg bg-white border border-gray-200 p-6 text-sm text-gray-500">Loading users…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users &amp; Access Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage provisioning state, tenant assignment, and role assignment.
          </p>
        </div>
        <InviteUserForm tenants={tenants} canManageCrossTenant={canManageCrossTenant} onInvited={() => void loadUsers()} />
      </div>

      {notice && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                'Email',
                'Auth',
                'public.users',
                'public.user_roles',
                'Tenant',
                'Role',
                'MFA',
                'Provisioning',
                'Created',
                'Actions',
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                  No users found for your tenant scope.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={selectedUserId === user.id ? 'bg-blue-50/40' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-3 text-sm text-gray-900">{user.email ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
                        user.auth_status === 'active'
                          ? 'good'
                          : user.auth_status === 'invited'
                            ? 'warn'
                            : 'bad'
                      )}`}
                    >
                      {AUTH_LABELS[user.auth_status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{user.has_public_user ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{user.has_active_user_role ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{user.tenant?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">
                    {user.active_role ? user.active_role.replace(/_/g, ' ') : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">
                    {user.mfa_enabled === null ? 'Unknown' : user.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
                        user.provisioning_status === 'complete'
                          ? 'good'
                          : user.provisioning_status === 'missing_auth'
                            ? 'bad'
                            : 'warn'
                      )}`}
                    >
                      {PROVISIONING_LABELS[user.provisioning_status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      size="sm"
                      variant={selectedUserId === user.id ? 'secondary' : 'outline'}
                      onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
                    >
                      {selectedUserId === user.id ? 'Close' : 'Manage'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manage user access</h2>
            <p className="text-sm text-gray-600 mt-1">
              User ID: <span className="font-mono">{selectedUser.id}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tenant assignment</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={tenantSelections[selectedUser.id] ?? ''}
                onChange={(e) =>
                  setTenantSelections((prev) => ({ ...prev, [selectedUser.id]: e.target.value }))
                }
                disabled={!selectedUser.has_auth_user || pendingAction === selectedUser.id}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  pendingAction === selectedUser.id ||
                  !selectedUser.has_auth_user ||
                  !tenantSelections[selectedUser.id]
                }
                onClick={() =>
                  void runAction(
                    selectedUser.id,
                    { action: 'assign_tenant', tenant_id: tenantSelections[selectedUser.id] },
                    'Tenant assignment updated.'
                  )
                }
              >
                Assign tenant
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {selectedUser.has_active_user_role ? 'Change role' : 'Assign role'}
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={roleSelections[selectedUser.id] ?? ''}
                onChange={(e) =>
                  setRoleSelections((prev) => ({ ...prev, [selectedUser.id]: e.target.value as Role }))
                }
                disabled={pendingAction === selectedUser.id}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={pendingAction === selectedUser.id || !roleSelections[selectedUser.id]}
                onClick={() =>
                  void runAction(
                    selectedUser.id,
                    {
                      action: selectedUser.has_active_user_role ? 'change_role' : 'assign_role',
                      role: roleSelections[selectedUser.id],
                    },
                    'Role assignment updated.'
                  )
                }
              >
                {selectedUser.has_active_user_role ? 'Change role' : 'Assign role'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pendingAction === selectedUser.id || !selectedUser.has_active_user_role}
                onClick={() =>
                  void runAction(selectedUser.id, { action: 'revoke_role' }, 'Role revoked.')
                }
              >
                Revoke active role
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Provisioning repair</label>
              <p className="text-xs text-gray-500">
                Use when user exists in auth but is missing app user/role records.
              </p>
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  pendingAction === selectedUser.id ||
                  selectedUser.provisioning_status === 'complete' ||
                  !selectedUser.has_auth_user
                }
                onClick={() =>
                  void runAction(
                    selectedUser.id,
                    {
                      action: 'repair_provisioning',
                      tenant_id: tenantSelections[selectedUser.id],
                      role: roleSelections[selectedUser.id],
                    },
                    'Provisioning repaired.'
                  )
                }
              >
                Repair provisioning
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
