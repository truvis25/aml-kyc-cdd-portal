import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { computeRiskScore } from '@/modules/risk/risk.service';
import { getLatestCustomerData } from '@/modules/kyc-individual/kyc.repository';
import { log } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'risk:read');

    const { customerId } = await params;
    const data = await getLatestCustomerData(customerId, auth.user.tenant_id);
    if (!data) return NextResponse.json({ error: 'Customer data not found' }, { status: 404 });

    const assessment = await computeRiskScore(
      customerId,
      auth.user.tenant_id,
      {
        nationality: data.nationality ?? undefined,
        country_of_residence: data.country_of_residence ?? undefined,
        pep_status: data.pep_status,
        occupation: data.occupation ?? undefined,
        dual_nationality: data.dual_nationality,
      },
      auth.user.id
    );

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('POST /api/risk/[customerId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
