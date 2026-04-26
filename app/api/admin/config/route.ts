import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const ConfigSchema = z.object({
  name: z.string().min(2).max(100),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');

    const body = await request.json();
    const parsed = ConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('tenants')
      .update({ name: parsed.data.name })
      .eq('id', auth.user.tenant_id);

    if (error) throw new Error(error.message);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: AuditEventType.CONFIG_CHANGED,
      entity_type: AuditEntityType.TENANT,
      entity_id: auth.user.tenant_id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: { field: 'name', new_value: parsed.data.name },
    });

    return NextResponse.json({ name: parsed.data.name });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
