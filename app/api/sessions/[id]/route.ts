import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getSessionState } from '@/modules/onboarding/onboarding.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:read');

    const { id } = await params;
    const { session, current_step } = await getSessionState(id, auth.user.tenant_id);

    return NextResponse.json({ session, current_step });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Session not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('GET /api/sessions/[id] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
