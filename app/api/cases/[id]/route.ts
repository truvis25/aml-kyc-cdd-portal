import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getCaseDetail } from '@/modules/cases/cases.service';
import { log } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:read_assigned');

    const { id } = await params;
    const detail = await getCaseDetail(id, auth.user.tenant_id);

    // Mask SAR flag for non-MLRO roles
    const canViewSar = auth.user.role === 'mlro' || auth.user.role === 'platform_super_admin';
    const case_ = canViewSar
      ? detail.case
      : { ...detail.case, sar_flagged: undefined };

    return NextResponse.json({ case: case_, events: detail.events });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Case not found') return NextResponse.json({ error: msg }, { status: 404 });
    log.error('GET /api/cases/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
