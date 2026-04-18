import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { createClient as createServerClient } from '@/lib/supabase/server';
// Admin client is intentionally used here for auth.admin.inviteUserByEmail.
// API routes are server-only — the service role key is never exposed to the browser.
import { createAdminClient } from '@/lib/supabase/admin';

const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'tenant_admin',
    'mlro',
    'senior_reviewer',
    'analyst',
    'onboarding_agent',
    'read_only',
  ]),
  display_name: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await requireAuth();

    // 2. Authorize — only tenant_admin and platform_super_admin can invite
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

    const { email, role, display_name } = parsed.data;

    // 4. Look up the role_id for the requested role
    const supabase = await createServerClient();
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // 5. Send invitation via Supabase Auth (requires service role)
    const adminClient = createAdminClient();
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
      console.error('Invite error:', inviteError?.message);
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
      console.error('User lookup error:', existingUserError.message);
      return NextResponse.json(
        { error: 'Failed to validate existing user record. Please try again.' },
        { status: 500 }
      );
    }

    if (existingUser && existingUser.tenant_id !== auth.user.tenant_id) {
      return NextResponse.json(
        { error: 'User already belongs to a different tenant.' },
        { status: 409 }
      );
    }

    const { error: userUpsertError } = await adminClient.from('users').upsert(
      {
        id: invitedUserId,
        tenant_id: auth.user.tenant_id,
        display_name: display_name ?? null,
        mfa_enabled: false,
        status: 'active',
      },
      { onConflict: 'id' }
    );

    if (userUpsertError) {
      console.error('User upsert error:', userUpsertError.message);
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
      .eq('tenant_id', auth.user.tenant_id)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingRoleError) {
      console.error('Role lookup error:', existingRoleError.message);
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
        tenant_id: auth.user.tenant_id,
        role_id: roleData.id,
        granted_by: auth.user.id,
      });

      if (roleInsertError) {
        console.error('Role insert error:', roleInsertError.message);
        return NextResponse.json(
          { error: 'Failed to assign role. Please try again.' },
          { status: 500 }
        );
      }
    }

    // 8. Emit audit event
    await emit({
      tenant_id: auth.user.tenant_id,
      event_type: AuditEventType.USER_INVITED,
      entity_type: AuditEntityType.USER,
      entity_id: invitedUserId,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        invited_user_id: invitedUserId,
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
    console.error('Invite handler error:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
