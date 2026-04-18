import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getScreeningResults } from '@/modules/screening/screening.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'screening:read');

    const { jobId } = await params;
    const result = await getScreeningResults(jobId, auth.user.tenant_id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('not found')) return NextResponse.json({ error: msg }, { status: 404 });
    console.error('GET /api/screening/jobs/[jobId] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
