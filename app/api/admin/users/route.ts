import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
// Admin client is intentionally used here for auth.admin.inviteUserByEmail.
// API routes are server-only — the service role key is never exposed to the browser.
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Role,
  TENANT_ADMIN_ASSIGNABLE_ROLES,
  canManageCrossTenantUsers,
} from '@/lib/constants/roles';
import { listManagedUsers } from '@/modules/admin-users/admin-users.service';
import { log } from '@/lib/logger';

const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(Role),
  display_name: z.string().min(1).max(100).optional(),
  tenant_id: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_users');

    const adminClient = createAdminClient();
    const result = await listManagedUsers({
      actor: {
        id: auth.user.id,
        tenant_id: auth.user.tenant_id,
        role: auth.user.role,
      },
      adminClient,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    log.error('GET /api/admin/users error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await requireAuth();

    // 2. Authorize
    assertPermission(auth.user.role, 'admin:manage_users');

    // 3. Parse and validate input
    const body = await request.json();
    const parsed = InviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role, display_name, tenant_id } = parsed.data;
    const targetTenantId = tenant_id ?? auth.user.tenant_id;

    if (!canManageCrossTenantUsers(auth.user.role) && targetTenantId !== auth.user.tenant_id) {
      return NextResponse.json(
        { error: 'You can only invite users to your own tenant.' },
        { status: 403 }
      );
    }

    if (!canManageCrossTenantUsers(auth.user.role) && !TENANT_ADMIN_ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'You are not allowed to assign this role.' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // 4. Look up the role_id for the requested role
    const { data: roleData, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // 5. Send invitation via Supabase Auth (requires service role)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          display_name: display_name ?? null,
        },
      }
    );

    if (inviteError || !inviteData.user) {
      // Do not leak internal error details
      log.error('Invite error', inviteError);
      return NextResponse.json(
        { error: 'Failed to send invitation. Please try again.' },
        { status: 500 }
      );
    }

    const invitedUserId = inviteData.user.id;

    // 6. Create user profile record with service role (RLS-safe server boundary).
    const { data: existingUser, error: existingUserError } = await adminClient
      .from('users')
      .select('tenant_id')
      .eq('id', invitedUserId)
      .maybeSingle();

    if (existingUserError) {
      log.error('User lookup error', existingUserError);
      return NextResponse.json(
        { error: 'Failed to validate existing user record. Please try again.' },
        { status: 500 }
      );
    }

    if (existingUser && existingUser.tenant_id !== targetTenantId) {
      return NextResponse.json(
        { error: 'User is already assigned to a different tenant.' },
        { status: 409 }
      );
    }

    const { error: userUpsertError } = await adminClient.from('users').upsert(
      {
        id: invitedUserId,
        tenant_id: targetTenantId,
        display_name: display_name ?? null,
        mfa_enabled: false,
        status: 'active',
      },
      { onConflict: 'id' }
    );

    if (userUpsertError) {
      log.error('User upsert error', userUpsertError);
      return NextResponse.json(
        { error: 'Failed to create user record. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Create user_roles record (pre-assigned role — not self-selected)
    const { data: existingActiveRole, error: existingRoleError } = await adminClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', invitedUserId)
      .eq('tenant_id', targetTenantId)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingRoleError) {
      log.error('Role lookup error', existingRoleError);
      return NextResponse.json(
        { error: 'Failed to validate role assignment. Please try again.' },
        { status: 500 }
      );
    }

    if (existingActiveRole && existingActiveRole.role_id !== roleData.id) {
      return NextResponse.json(
        { error: 'User already has an active role. Revoke it before assigning a new one.' },
        { status: 409 }
      );
    }

    if (!existingActiveRole) {
      const { error: roleInsertError } = await adminClient.from('user_roles').insert({
        user_id: invitedUserId,
        tenant_id: targetTenantId,
        role_id: roleData.id,
        granted_by: auth.user.id,
      });

      if (roleInsertError) {
        log.error('Role insert error', roleInsertError);
        return NextResponse.json(
          { error: 'Failed to assign role. Please try again.' },
          { status: 500 }
        );
      }
    }

    // 8. Emit audit event
    await emit({
      tenant_id: targetTenantId,
      event_type: AuditEventType.USER_INVITED,
      entity_type: AuditEntityType.USER,
      entity_id: invitedUserId,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        invited_user_id: invitedUserId,
        tenant_id: targetTenantId,
        assigned_role: role,
        invited_by_role: auth.user.role,
      },
    });

    return NextResponse.json(
      { message: 'Invitation sent successfully', user_id: invitedUserId },
      { status: 201 }
    );
  } catch (err) {
    // Handle permission denied
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    log.error('Invite handler error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
