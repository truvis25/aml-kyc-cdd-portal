import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { captureConsent } from '@/modules/consent/consent.service';
import { ConsentSchema } from '@/lib/validations/consent';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const body = await request.json();
    const parsed = ConsentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const user_agent = request.headers.get('user-agent') ?? null;

    const record = await captureConsent(
      {
        tenant_id: auth.user.tenant_id,
        customer_id: parsed.data.customer_id,
        data_processing: parsed.data.data_processing,
        aml_screening: parsed.data.aml_screening,
        identity_verification: parsed.data.identity_verification,
        third_party_sharing: parsed.data.third_party_sharing,
        consent_version: parsed.data.consent_version,
        ip_address: ip,
        user_agent,
      },
      auth.user.id
    );

    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/consent error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
