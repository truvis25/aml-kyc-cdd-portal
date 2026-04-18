import type { Role } from '@/lib/constants/roles';

export type ManagedUserAuthStatus = 'active' | 'invited' | 'missing_auth';
export type ManagedUserProvisioningStatus =
  | 'complete'
  | 'missing_app_user'
  | 'missing_tenant'
  | 'missing_role'
  | 'missing_auth';

export interface ManagedTenant {
  id: string;
  name: string;
  slug: string;
}

export interface ManagedRole {
  id: string;
  name: Role;
}

export interface ManagedUserRecord {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
  auth_status: ManagedUserAuthStatus;
  has_auth_user: boolean;
  has_public_user: boolean;
  has_active_user_role: boolean;
  tenant: ManagedTenant | null;
  active_role: Role | null;
  mfa_enabled: boolean | null;
  provisioning_status: ManagedUserProvisioningStatus;
  invited_at: string | null;
  last_sign_in_at: string | null;
}

export interface ListManagedUsersResult {
  users: ManagedUserRecord[];
  tenants: ManagedTenant[];
  roles: ManagedRole[];
  can_manage_cross_tenant: boolean;
}

export type ManageUserAction =
  | {
      action: 'assign_tenant';
      tenant_id: string;
    }
  | {
      action: 'assign_role';
      role: Role;
    }
  | {
      action: 'change_role';
      role: Role;
    }
  | {
      action: 'revoke_role';
    }
  | {
      action: 'repair_provisioning';
      tenant_id?: string;
      role?: Role;
    };
