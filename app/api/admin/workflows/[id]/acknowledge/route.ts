import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { Role } from '@/lib/constants/roles';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import { log } from '@/lib/logger';

const AckSchema = z.object({
  notes: z.string().max(2000).optional(),
});

/**
 * Records an MLRO acknowledgement for activating a specific workflow version.
 *
 * Required by the `enforce_workflow_activation_ack` trigger (migration 0031):
 * `workflow_definitions.is_active` cannot transition false → true for a
 * tenant-scoped workflow without an un-revoked ack from a user with role
 * 'mlro' on the same (workflow_id, version).
 *
 * Authorization: MLRO only. Tenant Admin can manage workflows but cannot
 * self-acknowledge — separation of duty.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if (auth.user.role !== Role.MLRO) {
      throw new PermissionDeniedError(auth.user.role, 'admin:activate_workflow');
    }
    assertPermission(auth.user.role, 'admin:activate_workflow');

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = AckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Confirm the workflow exists and belongs to this tenant. Platform-level
    // workflows (tenant_id IS NULL) are out of scope — they don't require
    // tenant MLRO ack per the trigger.
    const { data: workflow, error: fetchError } = await supabase
      .from('workflow_definitions')
      .select('id, name, version, tenant_id')
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id)
      .single();
    if (fetchError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or not tenant-scoped' },
        { status: 404 },
      );
    }
    const wf = workflow as { id: string; name: string; version: number; tenant_id: string };

    const { error: insertError } = await supabase.from('workflow_activation_acks').insert({
      tenant_id: wf.tenant_id,
      workflow_id: wf.id,
      workflow_version: wf.version,
      acknowledged_by: auth.user.id,
      acknowledged_role: Role.MLRO,
      notes: parsed.data.notes ?? null,
    });

    if (insertError) {
      // Unique-violation = duplicate ack from the same user on the same
      // version. Treat as success (idempotent).
      if (insertError.code === '23505') {
        return NextResponse.json({ acknowledged: true, duplicate: true });
      }
      throw new Error(insertError.message);
    }

    await audit.emit({
      tenant_id: wf.tenant_id,
      event_type: AuditEventType.WORKFLOW_ACTIVATED, // dedicated ack event would land here in a future migration
      entity_type: AuditEntityType.WORKFLOW_DEFINITION,
      entity_id: wf.id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        action: 'mlro_acknowledged',
        workflow_name: wf.name,
        workflow_version: wf.version,
      },
    });

    return NextResponse.json({ acknowledged: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: 'Only MLRO may acknowledge workflow activation' },
        { status: 403 },
      );
    }
    log.error('POST /api/admin/workflows/[id]/acknowledge error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
