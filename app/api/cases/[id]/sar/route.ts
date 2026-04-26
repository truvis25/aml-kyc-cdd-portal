import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const SarSchema = z.object({
  sar_flagged: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { id } = await params;
    const body = await request.json();
    const parsed = SarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: case_, error: fetchError } = await supabase
      .from('cases')
      .select('id, tenant_id, sar_flagged')
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id)
      .single();

    if (fetchError || !case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('cases')
      .update({ sar_flagged: parsed.data.sar_flagged })
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id);

    if (updateError) throw new Error(updateError.message);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: parsed.data.sar_flagged
        ? AuditEventType.CASE_SAR_FLAGGED
        : AuditEventType.CASE_SAR_UNFLAGGED,
      entity_type: AuditEntityType.CASE,
      entity_id: id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: { sar_flagged: parsed.data.sar_flagged },
    });

    return NextResponse.json({ sar_flagged: parsed.data.sar_flagged });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
