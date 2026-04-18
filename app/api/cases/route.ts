import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getCaseList } from '@/modules/cases/cases.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:read_assigned');

    const { searchParams } = new URL(request.url);
    const queue = searchParams.get('queue') ?? undefined;
    const status = searchParams.get('status') ?? undefined;

    const cases = await getCaseList(
      auth.user.tenant_id,
      auth.user.role,
      auth.user.id,
      { queue, status }
    );

    return NextResponse.json({ cases });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('GET /api/cases error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
