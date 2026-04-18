import { NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateSession } from '@/modules/onboarding/onboarding.service';

export async function POST() {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:create');

    const { session, first_step } = await initiateSession(auth.user.tenant_id, auth.user.id);

    return NextResponse.json({ session, first_step }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/sessions error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
