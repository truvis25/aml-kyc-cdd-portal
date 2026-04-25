import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { submitBusinessData, getBusiness } from '@/modules/kyb/kyb.service';
import { KybBusinessSchema } from '@/lib/validations/kyb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const { id: business_id } = await params;
    const body = await request.json();
    const parsed = KybBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const version = await submitBusinessData(
      business_id,
      auth.user.tenant_id,
      parsed.data,
      auth.user.id
    );

    return NextResponse.json({ version });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('not found')) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    console.error('PATCH /api/businesses/[id]/data error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:read');

    const { id: business_id } = await params;
    const result = await getBusiness(business_id, auth.user.tenant_id);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('not found')) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    console.error('GET /api/businesses/[id]/data error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
