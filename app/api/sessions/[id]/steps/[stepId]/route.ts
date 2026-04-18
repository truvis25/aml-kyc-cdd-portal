import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { submitStep } from '@/modules/onboarding/onboarding.service';

const StepSubmitSchema = z.object({
  data: z.record(z.unknown()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const { id, stepId } = await params;
    const body = await request.json();
    const parsed = StepSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await submitStep(
      id,
      auth.user.tenant_id,
      { step_id: stepId, data: parsed.data.data },
      auth.user.id
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('not found') || msg.includes('already complete')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error('POST /api/sessions/[id]/steps/[stepId] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
