import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';

const VerifySchema = z.object({
  status: z.enum(['verified', 'rejected']),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'documents:read');

    const { id } = await params;
    const body = await request.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, tenant_id, customer_id, document_type, status')
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .eq('tenant_id', auth.user.tenant_id);

    if (updateError) throw new Error(updateError.message);

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: parsed.data.status === 'verified'
        ? AuditEventType.DOCUMENT_ACCEPTED
        : AuditEventType.DOCUMENT_REJECTED,
      entity_type: AuditEntityType.DOCUMENT,
      entity_id: id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: {
        document_type: (doc as { document_type: string }).document_type,
        status: parsed.data.status,
        ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
      },
    });

    return NextResponse.json({ status: parsed.data.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
