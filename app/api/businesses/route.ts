import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateBusiness } from '@/modules/kyb/kyb.service';
import { log } from '@/lib/logger';

const CreateBusinessSchema = z.object({
  customer_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const body = await request.json();
    const parsed = CreateBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const business = await initiateBusiness(
      auth.user.tenant_id,
      parsed.data.customer_id,
      auth.user.id
    );

    return NextResponse.json({ business }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('POST /api/businesses error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
