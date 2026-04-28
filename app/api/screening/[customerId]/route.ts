import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateScreening } from '@/modules/screening/screening.service';
import { getLatestCustomerData } from '@/modules/kyc-individual/kyc.repository';
import { log } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'screening:read');

    const { customerId } = await params;
    const data = await getLatestCustomerData(customerId, auth.user.tenant_id);
    if (!data) return NextResponse.json({ error: 'Customer data not found' }, { status: 404 });

    const result = await initiateScreening(
      {
        customer_id: customerId,
        tenant_id: auth.user.tenant_id,
        full_name: data.full_name ?? '',
        date_of_birth: data.date_of_birth ?? undefined,
        nationality: data.nationality ?? undefined,
      },
      auth.user.id
    );

    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('POST /api/screening error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
