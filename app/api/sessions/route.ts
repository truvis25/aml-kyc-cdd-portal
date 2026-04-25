import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateSession } from '@/modules/onboarding/onboarding.service';

const CreateSessionSchema = z.object({
  customer_type: z.enum(['individual', 'corporate']).default('individual'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:create');

    const body = await request.json().catch(() => ({}));
    const parsed = CreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { session, first_step } = await initiateSession(
      auth.user.tenant_id,
      auth.user.id,
      parsed.data.customer_type
    );

    return NextResponse.json({ session, first_step }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/sessions error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
