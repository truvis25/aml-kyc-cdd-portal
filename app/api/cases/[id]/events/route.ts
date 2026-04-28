import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { addNote, escalateCase, requestAdditionalInfo } from '@/modules/cases/cases.service';
import { sendRaiEmail } from '@/modules/notifications';
import { log } from '@/lib/logger';

const CaseEventSchema = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('note'),
    note: z.string().min(1).max(5000),
  }),
  z.object({
    event_type: z.literal('escalation'),
    reason: z.string().min(10).max(2000),
  }),
  z.object({
    event_type: z.literal('request_additional_info'),
    info_requested: z.string().min(10).max(5000),
    documents_required: z.array(z.string().min(1).max(200)).max(20).optional(),
  }),
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:add_note');

    const { id: case_id } = await params;
    const body = await request.json();
    const parsed = CaseEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.event_type === 'note') {
      const event = await addNote(case_id, auth.user.tenant_id, parsed.data.note, auth.user.id, auth.user.role);
      return NextResponse.json({ event }, { status: 201 });
    }

    if (parsed.data.event_type === 'escalation') {
      assertPermission(auth.user.role, 'cases:escalate');
      await escalateCase(case_id, auth.user.tenant_id, parsed.data.reason, auth.user.id, auth.user.role);
      return NextResponse.json({ message: 'Case escalated' });
    }

    if (parsed.data.event_type === 'request_additional_info') {
      assertPermission(auth.user.role, 'cases:request_additional_info');
      const { case: case_, event } = await requestAdditionalInfo({
        case_id,
        tenant_id: auth.user.tenant_id,
        info_requested: parsed.data.info_requested,
        documents_required: parsed.data.documents_required,
        actor_id: auth.user.id,
        actor_role: auth.user.role,
      });

      // Email is best-effort: failure does NOT roll back the case event.
      // The notification_events row records what happened either way.
      const sendResult = await sendRaiEmail({
        tenantId: auth.user.tenant_id,
        caseId: case_id,
        customerId: case_.customer_id,
        infoRequested: parsed.data.info_requested,
        documentsRequired: parsed.data.documents_required,
        actorId: auth.user.id,
        actorRole: auth.user.role,
      });

      return NextResponse.json(
        { event, email: { ok: sendResult.ok, error: sendResult.error ?? null } },
        { status: 201 },
      );
    }

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Case not found') return NextResponse.json({ error: msg }, { status: 404 });
    log.error('POST /api/cases/[id]/events error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
