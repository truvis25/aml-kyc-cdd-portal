import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import {
  Role,
  TENANT_ADMIN_ASSIGNABLE_ROLES,
  canManageCrossTenantUsers,
} from '@/lib/constants/roles';
import type { Database } from '@/lib/supabase/database.types';
import { emit } from '@/modules/audit/audit.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ListManagedUsersResult,
  ManageUserAction,
  ManagedRole,
  ManagedTenant,
  ManagedUserRecord,
} from './admin-users.types';

interface ActorContext {
  id: string;
  tenant_id: string;
  role: Role;
}

interface ListManagedUsersParams {
  actor: ActorContext;
  adminClient: AdminClient;
}

interface ManageUserAccessParams {
  actor: ActorContext;
  userId: string;
  action: ManageUserAction;
  adminClient: AdminClient;
}

type AdminClient = SupabaseClient<Database>;
type RoleAction = Extract<
  ManageUserAction,
  { action: 'assign_role' } | { action: 'change_role' } | { action: 'repair_provisioning' }
>;

interface PublicUserRow {
  id: string;
  tenant_id: string;
  display_name: string | null;
  mfa_enabled: boolean;
  status: string;
  created_at: string;
}

interface ActiveRoleRow {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
}

interface AuthUserView {
  id: string;
  email: string | null;
  created_at: string | null;
  invited_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

function isRoleAssignableByActor(actorRole: Role, role: Role): boolean {
  if (canManageCrossTenantUsers(actorRole)) return true;
  return TENANT_ADMIN_ASSIGNABLE_ROLES.includes(role);
}

async function getAuthUserById(adminClient: AdminClient, userId: string): Promise<AuthUserView | null> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    if (error) {
      console.warn(`Admin users auth lookup failed: ${error.message}`);
    }
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    created_at: data.user.created_at ?? null,
    invited_at: data.user.invited_at ?? null,
    last_sign_in_at: data.user.last_sign_in_at ?? null,
    email_confirmed_at: data.user.email_confirmed_at ?? null,
  };
}

function toProvisioningStatus(
  hasAuthUser: boolean,
  appUser: PublicUserRow | null,
  hasActiveRole: boolean
): ManagedUserRecord['provisioning_status'] {
  if (!hasAuthUser) return 'missing_auth';
  if (!appUser) return 'missing_app_user';
  if (!appUser.tenant_id) return 'missing_tenant';
  if (!hasActiveRole) return 'missing_role';
  return 'complete';
}

function toAuthStatus(authUser: AuthUserView | null): ManagedUserRecord['auth_status'] {
  if (!authUser) return 'missing_auth';
  if (!authUser.email_confirmed_at) return 'invited';
  return 'active';
}

function ensureTenantScope(actor: ActorContext, tenantId: string): void {
  if (canManageCrossTenantUsers(actor.role)) return;
  if (tenantId !== actor.tenant_id) {
    throw new ForbiddenOperationError('You can only manage users in your own tenant.');
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function resolveRequestedRole(action: RoleAction): Role {
  if (action.action === 'repair_provisioning') {
    if (!action.role) {
      throw new InvalidOperationError('Role is required for this action.');
    }
    return action.role;
  }
  return action.role;
}

export async function listManagedUsers(params: ListManagedUsersParams): Promise<ListManagedUsersResult> {
  const { actor, adminClient } = params;
  const crossTenant = canManageCrossTenantUsers(actor.role);

  const tenantQuery = adminClient.from('tenants').select('id, name, slug');
  const { data: tenantRows, error: tenantError } = crossTenant
    ? await tenantQuery.order('name', { ascending: true })
    : await tenantQuery.eq('id', actor.tenant_id);

  if (tenantError) throw new Error(`Failed to read tenants: ${tenantError.message}`);

  const tenants: ManagedTenant[] = (tenantRows ?? []).map((t: { id: string; name: string; slug: string }) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
  const tenantIds = tenants.map((t) => t.id);
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  const { data: roleRows, error: roleError } = await adminClient
    .from('roles')
    .select('id, name')
    .order('name', { ascending: true });
  if (roleError) throw new Error(`Failed to read roles: ${roleError.message}`);

  const roles: ManagedRole[] = (roleRows ?? []).map((r: { id: string; name: string }) => ({
    id: r.id,
    name: r.name as Role,
  }));
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));

  let appUsers: PublicUserRow[] = [];
  let activeRoles: ActiveRoleRow[] = [];
  let invitedAuditRows: Array<{ tenant_id: string; entity_id: string; event_time: string }> = [];

  if (tenantIds.length > 0) {
    const { data: appUserRows, error: appUserError } = await adminClient
      .from('users')
      .select('id, tenant_id, display_name, mfa_enabled, status, created_at')
      .in('tenant_id', tenantIds)
      .order('created_at', { ascending: false });
    if (appUserError) throw new Error(`Failed to read users: ${appUserError.message}`);
    appUsers = (appUserRows ?? []) as PublicUserRow[];

    const { data: activeRoleRows, error: activeRoleError } = await adminClient
      .from('user_roles')
      .select('id, user_id, tenant_id, role_id')
      .in('tenant_id', tenantIds)
      .is('revoked_at', null);
    if (activeRoleError) throw new Error(`Failed to read user roles: ${activeRoleError.message}`);
    activeRoles = (activeRoleRows ?? []) as ActiveRoleRow[];

    const { data: inviteRows, error: inviteError } = await adminClient
      .from('audit_log')
      .select('tenant_id, entity_id, event_time')
      .in('tenant_id', tenantIds)
      .eq('event_type', AuditEventType.USER_INVITED)
      .eq('entity_type', AuditEntityType.USER)
      .order('event_time', { ascending: false });
    if (inviteError) throw new Error(`Failed to read invite audit events: ${inviteError.message}`);
    invitedAuditRows = (inviteRows ?? []) as Array<{ tenant_id: string; entity_id: string; event_time: string }>;
  }

  const appUserById = new Map(appUsers.map((u) => [u.id, u]));
  const activeRoleByUserId = new Map(activeRoles.map((ur) => [ur.user_id, ur]));
  const inviteByUserId = new Map(invitedAuditRows.map((r) => [r.entity_id, r]));

  const candidateUserIds = Array.from(
    new Set([...appUsers.map((u) => u.id), ...invitedAuditRows.map((r) => r.entity_id)])
  );

  const authEntries = await Promise.all(
    candidateUserIds.map(async (id) => [id, await getAuthUserById(adminClient, id)] as const)
  );
  const authUserById = new Map(authEntries);

  const users: ManagedUserRecord[] = candidateUserIds.map((id) => {
    const appUser = appUserById.get(id) ?? null;
    const activeRole = activeRoleByUserId.get(id) ?? null;
    const authUser = authUserById.get(id) ?? null;
    const tenant = appUser ? tenantMap.get(appUser.tenant_id) ?? null : null;
    const invitedAudit = inviteByUserId.get(id);
    const roleName = activeRole ? (roleNameById.get(activeRole.role_id) ?? null) : null;

    const createdAt = appUser?.created_at ?? authUser?.created_at ?? invitedAudit?.event_time ?? null;

    return {
      id,
      email: authUser?.email ?? null,
      display_name: appUser?.display_name ?? null,
      created_at: createdAt,
      auth_status: toAuthStatus(authUser),
      has_auth_user: Boolean(authUser),
      has_public_user: Boolean(appUser),
      has_active_user_role: Boolean(activeRole),
      tenant,
      active_role: roleName,
      mfa_enabled: appUser?.mfa_enabled ?? null,
      provisioning_status: toProvisioningStatus(Boolean(authUser), appUser, Boolean(activeRole)),
      invited_at: authUser?.invited_at ?? invitedAudit?.event_time ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });

  const sortableUsers = users.map((user) => ({
    user,
    sortKey: user.created_at ? new Date(user.created_at).getTime() : Number.NEGATIVE_INFINITY,
  }));
  sortableUsers.sort((a, b) => b.sortKey - a.sortKey);
  const sortedUsers = sortableUsers.map((entry) => entry.user);

  const assignableRoles = crossTenant
    ? roles
    : roles.filter((role) => TENANT_ADMIN_ASSIGNABLE_ROLES.includes(role.name));

  return {
    users: sortedUsers,
    tenants,
    roles: assignableRoles,
    can_manage_cross_tenant: crossTenant,
  };
}

async function resolveRoleId(adminClient: AdminClient, role: Role): Promise<string> {
  const { data, error } = await adminClient.from('roles').select('id').eq('name', role).single();
  if (error || !data?.id) {
    throw new InvalidOperationError('Requested role was not found.');
  }
  return data.id as string;
}

async function getActiveRoleForTenant(
  adminClient: AdminClient,
  userId: string,
  tenantId: string
): Promise<ActiveRoleRow | null> {
  const { data, error } = await adminClient
    .from('user_roles')
    .select('id, user_id, tenant_id, role_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) throw new Error(`Failed to read active role assignment: ${error.message}`);
  return (data as ActiveRoleRow | null) ?? null;
}

async function ensureNoCrossTenantActiveRole(
  adminClient: AdminClient,
  userId: string,
  tenantId: string
): Promise<void> {
  const { data, error } = await adminClient
    .from('user_roles')
    .select('id, tenant_id')
    .eq('user_id', userId)
    .is('revoked_at', null);
  if (error) throw new Error(`Failed to validate active role assignments: ${error.message}`);

  const hasOtherTenantRole = ((data ?? []) as Array<{ tenant_id: string }>).some(
    (r) => r.tenant_id !== tenantId
  );
  if (hasOtherTenantRole) {
    throw new ConflictOperationError(
      'User has an active role assignment in another tenant. Revoke it before changing tenant.'
    );
  }
}

async function upsertPublicUser(
  adminClient: AdminClient,
  userId: string,
  tenantId: string,
  authUser: AuthUserView | null
): Promise<void> {
  const { data: currentUserRow } = await adminClient
    .from('users')
    .select('display_name, mfa_enabled, status')
    .eq('id', userId)
    .maybeSingle();

  const { error } = await adminClient.from('users').upsert(
    {
      id: userId,
      tenant_id: tenantId,
      display_name: currentUserRow?.display_name ?? null,
      mfa_enabled: currentUserRow?.mfa_enabled ?? false,
      status: currentUserRow?.status ?? (authUser ? 'active' : 'deactivated'),
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Failed to upsert app user record: ${error.message}`);
}

export async function manageUserAccess(params: ManageUserAccessParams): Promise<{ message: string }> {
  const { actor, userId, action, adminClient } = params;

  const authUser = await getAuthUserById(adminClient, userId);
  const { data: existingUserRow, error: existingUserError } = await adminClient
    .from('users')
    .select('id, tenant_id, display_name, mfa_enabled, status, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (existingUserError) throw new Error(`Failed to read app user: ${existingUserError.message}`);
  const existingUser = (existingUserRow as PublicUserRow | null) ?? null;

  if (action.action === 'assign_tenant') {
    if (!authUser) {
      throw new InvalidOperationError('Cannot assign tenant because the user does not exist in auth.users.');
    }
    ensureTenantScope(actor, action.tenant_id);
    await ensureNoCrossTenantActiveRole(adminClient, userId, action.tenant_id);
    await upsertPublicUser(adminClient, userId, action.tenant_id, authUser);

    await emit({
      tenant_id: action.tenant_id,
      event_type: AuditEventType.USER_ACTIVATED,
      entity_type: AuditEntityType.USER,
      entity_id: userId,
      actor_id: actor.id,
      actor_role: actor.role,
      payload: {
        user_id: userId,
        action: 'tenant_assigned',
        tenant_id: action.tenant_id,
      },
    });

    return { message: 'Tenant assignment saved.' };
  }

  let tenantId = existingUser?.tenant_id ?? actor.tenant_id;

  if (action.action === 'repair_provisioning') {
    if (!authUser) {
      throw new InvalidOperationError('Cannot repair provisioning because user is missing from auth.users.');
    }
    tenantId = action.tenant_id ?? existingUser?.tenant_id ?? actor.tenant_id;
    ensureTenantScope(actor, tenantId);
    await ensureNoCrossTenantActiveRole(adminClient, userId, tenantId);
    await upsertPublicUser(adminClient, userId, tenantId, authUser);
  } else if (!existingUser) {
    throw new InvalidOperationError('User is missing from public.users. Use repair provisioning first.');
  } else {
    ensureTenantScope(actor, tenantId);
  }

  if (action.action === 'revoke_role') {
    const activeRole = await getActiveRoleForTenant(adminClient, userId, tenantId);
    if (!activeRole) throw new ConflictOperationError('No active role assignment to revoke.');

    const { error } = await adminClient
      .from('user_roles')
      .update({ revoked_at: nowIso() })
      .eq('id', activeRole.id)
      .is('revoked_at', null);
    if (error) throw new Error(`Failed to revoke role assignment: ${error.message}`);

    await emit({
      tenant_id: tenantId,
      event_type: AuditEventType.USER_ROLE_REVOKED,
      entity_type: AuditEntityType.USER_ROLE,
      entity_id: activeRole.id,
      actor_id: actor.id,
      actor_role: actor.role,
      payload: {
        user_id: userId,
        tenant_id: tenantId,
        previous_role_id: activeRole.role_id,
      },
    });

    return { message: 'Active role assignment revoked.' };
  }

  if (
    action.action !== 'assign_role' &&
    action.action !== 'change_role' &&
    action.action !== 'repair_provisioning'
  ) {
    throw new InvalidOperationError('Invalid role operation.');
  }

  const requestedRole = resolveRequestedRole(action);
  if (!isRoleAssignableByActor(actor.role, requestedRole)) {
    throw new ForbiddenOperationError('You are not allowed to assign this role.');
  }

  const roleId = await resolveRoleId(adminClient, requestedRole);
  const activeRole = await getActiveRoleForTenant(adminClient, userId, tenantId);

  if (action.action === 'assign_role') {
    if (activeRole) throw new ConflictOperationError('User already has an active role assignment.');
  }

  if (action.action === 'change_role') {
    if (!activeRole) throw new ConflictOperationError('No active role exists. Use assign role instead.');
    if (activeRole.role_id === roleId) {
      return { message: 'Role is already assigned.' };
    }

    const { error: revokeError } = await adminClient
      .from('user_roles')
      .update({ revoked_at: nowIso() })
      .eq('id', activeRole.id)
      .is('revoked_at', null);
    if (revokeError) throw new Error(`Failed to revoke previous role assignment: ${revokeError.message}`);

    await emit({
      tenant_id: tenantId,
      event_type: AuditEventType.USER_ROLE_REVOKED,
      entity_type: AuditEntityType.USER_ROLE,
      entity_id: activeRole.id,
      actor_id: actor.id,
      actor_role: actor.role,
      payload: {
        user_id: userId,
        tenant_id: tenantId,
        previous_role_id: activeRole.role_id,
      },
    });
  }

  if (action.action === 'repair_provisioning' && activeRole && activeRole.role_id !== roleId) {
    throw new ConflictOperationError('User already has an active role. Use change role action instead.');
  }

  if (!activeRole || action.action === 'change_role') {
    const { data: insertedRole, error: insertError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role_id: roleId,
        granted_by: actor.id,
      })
      .select('id')
      .single();
    if (insertError) throw new Error(`Failed to insert role assignment: ${insertError.message}`);

    await emit({
      tenant_id: tenantId,
      event_type: AuditEventType.USER_ROLE_ASSIGNED,
      entity_type: AuditEntityType.USER_ROLE,
      entity_id: insertedRole.id as string,
      actor_id: actor.id,
      actor_role: actor.role,
      payload: {
        user_id: userId,
        tenant_id: tenantId,
        assigned_role: requestedRole,
      },
    });
  }

  if (action.action === 'repair_provisioning') {
    await emit({
      tenant_id: tenantId,
      event_type: AuditEventType.USER_ACTIVATED,
      entity_type: AuditEntityType.USER,
      entity_id: userId,
      actor_id: actor.id,
      actor_role: actor.role,
      payload: {
        user_id: userId,
        action: 'provisioning_repaired',
      },
    });

    return { message: 'Provisioning repaired successfully.' };
  }

  if (action.action === 'assign_role') return { message: 'Role assigned.' };
  return { message: 'Role changed.' };
}

export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}

export class ForbiddenOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenOperationError';
  }
}

export class ConflictOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictOperationError';
  }
}
