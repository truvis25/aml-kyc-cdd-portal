import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { Role } from '@/lib/constants/roles';
import {
  ConflictOperationError,
  ForbiddenOperationError,
  InvalidOperationError,
  manageUserAccess,
} from '@/modules/admin-users/admin-users.service';
import { createAdminClient } from '@/lib/supabase/admin';

const ManageUserSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('assign_tenant'),
    tenant_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('assign_role'),
    role: z.nativeEnum(Role),
  }),
  z.object({
    action: z.literal('change_role'),
    role: z.nativeEnum(Role),
  }),
  z.object({
    action: z.literal('revoke_role'),
  }),
  z.object({
    action: z.literal('repair_provisioning'),
    tenant_id: z.string().uuid().optional(),
    role: z.nativeEnum(Role).optional(),
  }),
]);

interface Params {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_users');

    const body = await request.json();
    const parsed = ManageUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const result = await manageUserAccess({
      actor: {
        id: auth.user.id,
        tenant_id: auth.user.tenant_id,
        role: auth.user.role,
      },
      userId,
      action: parsed.data,
      adminClient,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError || err instanceof ForbiddenOperationError) {
      return NextResponse.json({ error: err.message || 'Forbidden' }, { status: 403 });
    }
    if (err instanceof InvalidOperationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ConflictOperationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    console.error(
      'PATCH /api/admin/users/[userId] error:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
