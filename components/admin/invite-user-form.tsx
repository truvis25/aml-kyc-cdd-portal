'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { Role } from '@/lib/constants/roles';

const ROLES = [
  { value: Role.PLATFORM_SUPER_ADMIN, label: 'Platform Super Admin' },
  { value: Role.MLRO, label: 'MLRO / Compliance Officer' },
  { value: Role.SENIOR_REVIEWER, label: 'Senior Reviewer' },
  { value: Role.ANALYST, label: 'Analyst' },
  { value: Role.ONBOARDING_AGENT, label: 'Onboarding Agent' },
  { value: Role.READ_ONLY, label: 'Read Only / Reporting' },
  { value: Role.TENANT_ADMIN, label: 'Tenant Admin' },
];

type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

interface InviteUserFormProps {
  tenants: TenantOption[];
  canManageCrossTenant: boolean;
  onInvited?: () => void;
}

export function InviteUserForm({ tenants, canManageCrossTenant, onInvited }: InviteUserFormProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.ANALYST);
  const [displayName, setDisplayName] = useState('');
  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const selectableRoles = useMemo(
    () => ROLES.filter((r) => canManageCrossTenant || r.value !== Role.PLATFORM_SUPER_ADMIN),
    [canManageCrossTenant]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const targetTenantId = tenantId || tenants[0]?.id;
    if (canManageCrossTenant && !targetTenantId) {
      setError('No tenant available for assignment.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        tenant_id: canManageCrossTenant ? targetTenantId : undefined,
        display_name: displayName || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Failed to send invitation.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    onInvited?.();
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setEmail('');
      setRole(Role.ANALYST);
      setDisplayName('');
      setTenantId(tenants[0]?.id ?? '');
    }, 2000);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <UserPlus className="h-4 w-4" />
        Invite user
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-medium text-gray-900 mb-1">Invite a user</h2>
        <p className="text-sm text-gray-500 mb-4">
          An invitation email will be sent. The user will set their own password.
        </p>

        {success ? (
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800 font-medium">Invitation sent successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="invite-name">Full name (optional)</Label>
              <Input
                id="invite-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={loading}
              >
                {selectableRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {canManageCrossTenant && (
              <div className="space-y-1">
                <Label htmlFor="invite-tenant">Tenant</Label>
                <select
                  id="invite-tenant"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={loading}
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || (canManageCrossTenant && tenants.length === 0)}>
                {loading ? 'Sending…' : 'Send invitation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
