import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const WorkflowUpdateSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:activate_workflow');

    const { id } = await params;
    const body = await request.json();
    const parsed = WorkflowUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the workflow belongs to this tenant (or is platform-level for super admin)
    const { data: workflow, error: fetchError } = await supabase
      .from('workflow_definitions')
      .select('id, name, tenant_id, is_active')
      .eq('id', id)
      .or(`tenant_id.eq.${auth.user.tenant_id},tenant_id.is.null`)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Platform-level workflows (tenant_id IS NULL) can only be toggled by platform_super_admin
    if ((workflow as { tenant_id: string | null }).tenant_id === null && auth.user.role !== 'platform_super_admin') {
      return NextResponse.json({ error: 'Only platform super admins can modify platform-level workflows' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('workflow_definitions')
      .update({ is_active: parsed.data.is_active })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: parsed.data.is_active
        ? AuditEventType.WORKFLOW_ACTIVATED
        : AuditEventType.WORKFLOW_DEACTIVATED,
      entity_type: AuditEntityType.WORKFLOW_DEFINITION,
      entity_id: id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        workflow_name: (workflow as { name: string }).name,
        is_active: parsed.data.is_active,
      },
    });

    return NextResponse.json({ is_active: parsed.data.is_active });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
