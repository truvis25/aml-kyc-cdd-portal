import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import {
  getLatestTenantConfig,
  recordTenantConfigVersion,
} from '@/modules/admin-config/admin-config.service';
import { TenantConfigUpdateSchema } from '@/lib/validations/tenant-config';

const TenantNameSchema = z.object({
  name: z.string().min(2).max(100),
});

export async function GET() {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');
    const row = await getLatestTenantConfig(auth.user.tenant_id);
    return NextResponse.json({ tenant_config: row });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST writes a NEW tenant_config version. Append-only — previous versions are
 * preserved and inspectable via the version history endpoint (future).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');

    const body = await request.json();
    const parsed = TenantConfigUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const row = await recordTenantConfigVersion({
      tenant_id: auth.user.tenant_id,
      config: parsed.data.config,
      notes: parsed.data.notes,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
    });

    return NextResponse.json({ tenant_config: row }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/admin/config error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH only updates the tenant display name on `tenants.name`. Kept for
 * backwards-compat with the existing admin UI; new config knobs go through
 * POST → tenant_config.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');

    const body = await request.json();
    const parsed = TenantNameSchema.safeParse(body);
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
