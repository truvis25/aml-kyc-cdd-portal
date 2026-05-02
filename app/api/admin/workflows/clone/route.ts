import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { cloneRulePack } from '@/modules/admin-config/rule-packs/clone';
import { isRulePack } from '@/modules/admin-config/rule-packs/catalog';
import { log } from '@/lib/logger';

const CloneSchema = z.object({
  source_workflow_id: z.string().uuid(),
});

/**
 * POST /api/admin/workflows/clone — copy a platform-level rule pack into the
 * caller's tenant as a new (tenant_id-scoped, is_active=false) workflow row.
 *
 * Permission: admin:activate_workflow (tenant_admin, platform_super_admin).
 *
 * Why is_active=false: every newly-cloned workflow MUST go through MLRO
 * acknowledgement before activation, exactly like a fresh workflow upload.
 * This is enforced server-side in the activate endpoint, but starting
 * inactive prevents an admin from accidentally going live without ack.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:activate_workflow');

    const body = await request.json();
    const parsed = CloneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (!isRulePack(parsed.data.source_workflow_id)) {
      return NextResponse.json(
        { error: 'source_workflow_id is not a known platform-level rule pack' },
        { status: 400 },
      );
    }

    const cloned = await cloneRulePack({
      sourceWorkflowId: parsed.data.source_workflow_id,
      tenantId: auth.user.tenant_id,
      actorId: auth.user.id,
      actorRole: auth.user.role,
    });

    return NextResponse.json({ workflow: cloned }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (
      msg.includes('Unknown rule pack') ||
      msg.includes('Source must be a platform-level') ||
      msg.includes('Source workflow not found')
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    log.error('POST /api/admin/workflows/clone error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
