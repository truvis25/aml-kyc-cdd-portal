import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const AssignSchema = z.object({
  assigned_to: z.string().uuid().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:assign');

    const { id } = await params;
    const body = await request.json();
    const parsed = AssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: case_, error: fetchError } = await supabase
      .from('cases')
      .select('id, tenant_id, assigned_to')
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id)
      .single();

    if (fetchError || !case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // If assigning to a specific user, verify they belong to this tenant
    if (parsed.data.assigned_to) {
      const { data: officer } = await supabase
        .from('users')
        .select('id')
        .eq('id', parsed.data.assigned_to)
        .eq('tenant_id', auth.user.tenant_id)
        .single();
      if (!officer) {
        return NextResponse.json({ error: 'Officer not found in this tenant' }, { status: 400 });
      }
    }

    const { error: updateError } = await supabase
      .from('cases')
      .update({ assigned_to: parsed.data.assigned_to })
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id);

    if (updateError) throw new Error(updateError.message);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: AuditEventType.CASE_ASSIGNED,
      entity_type: AuditEntityType.CASE,
      entity_id: id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        assigned_to: parsed.data.assigned_to,
        previously_assigned_to: (case_ as { assigned_to: string | null }).assigned_to,
      },
    });

    return NextResponse.json({ assigned_to: parsed.data.assigned_to });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
