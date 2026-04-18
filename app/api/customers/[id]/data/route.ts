import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { submitIdentityData } from '@/modules/kyc-individual/kyc.service';
import { KycIdentitySchema } from '@/lib/validations/kyc';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const { id: customer_id } = await params;
    const body = await request.json();
    const parsed = KycIdentitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const version = await submitIdentityData(
      customer_id,
      auth.user.tenant_id,
      parsed.data,
      auth.user.id
    );

    return NextResponse.json({ version });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Customer not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('PATCH /api/customers/[id]/data error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
