import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getLatestAssessment } from '@/modules/risk/risk.service';
import { log } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'risk:read');

    const { customerId } = await params;
    const assessment = await getLatestAssessment(customerId, auth.user.tenant_id);
    if (!assessment) return NextResponse.json({ error: 'No assessment found' }, { status: 404 });
    return NextResponse.json({ assessment });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('GET /api/risk/[customerId]/latest error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
