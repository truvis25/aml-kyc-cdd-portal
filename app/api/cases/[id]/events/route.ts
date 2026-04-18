import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { addNote, escalateCase } from '@/modules/cases/cases.service';

const CaseEventSchema = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('note'),
    note: z.string().min(1).max(5000),
  }),
  z.object({
    event_type: z.literal('escalation'),
    reason: z.string().min(10).max(2000),
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

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Case not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('POST /api/cases/[id]/events error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
