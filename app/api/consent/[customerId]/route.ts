import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getConsentStatus } from '@/modules/consent/consent.service';
import { log } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:read');

    const { customerId } = await params;
    const status = await getConsentStatus(customerId, auth.user.tenant_id);
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('GET /api/consent/[customerId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
