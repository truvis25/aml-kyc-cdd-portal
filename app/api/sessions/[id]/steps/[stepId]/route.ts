import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { submitStep } from '@/modules/onboarding/onboarding.service';
import { log } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const { id: sessionId, stepId } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await submitStep(
      sessionId,
      auth.user.tenant_id,
      { step_id: stepId, data: body.data ?? {} },
      auth.user.id
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('not found')) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (msg.includes('already complete')) return NextResponse.json({ error: 'Session already complete' }, { status: 409 });
    log.error('POST /api/sessions/[id]/steps/[stepId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
