import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createAdminClient } from '@/lib/supabase/admin';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const ResolveSchema = z.object({
  resolution: z.enum(['confirmed_match', 'false_positive', 'escalated']),
  rationale: z.string().min(10, 'Rationale must be at least 10 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hitId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'screening:resolve_hit');

    const { hitId } = await params;
    const body = await request.json();
    const parsed = ResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify hit belongs to this tenant
    const { data: hit, error: hitError } = await supabase
      .from('screening_hits')
      .select('id, tenant_id')
      .eq('id', hitId)
      .eq('tenant_id', auth.user.tenant_id)
      .single();

    if (hitError || !hit) return NextResponse.json({ error: 'Hit not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('screening_hit_resolutions')
      .insert({
        tenant_id: auth.user.tenant_id,
        hit_id: hitId,
        resolution: parsed.data.resolution,
        rationale: parsed.data.rationale,
        resolved_by: auth.user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    const resolution = data as { id: string };

    // Update hit status
    await supabase
      .from('screening_hits')
      .update({ status: parsed.data.resolution })
      .eq('id', hitId)
      .eq('tenant_id', auth.user.tenant_id);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: AuditEventType.SCREENING_HIT_RESOLVED,
      entity_type: AuditEntityType.SCREENING_HIT,
      entity_id: resolution.id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: { hit_id: hitId, resolution: parsed.data.resolution },
    });

    return NextResponse.json({ resolution: data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/screening/hits/[hitId]/resolve error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
