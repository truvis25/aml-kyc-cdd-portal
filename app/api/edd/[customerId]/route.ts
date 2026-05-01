import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { EddCaptureSchema } from '@/lib/validations/edd';
import { recordEdd, getLatestEddRecord, listEddRecordHistory } from '@/modules/edd/edd.service';
import { log } from '@/lib/logger';

/**
 * Read the EDD record(s) for a customer. By default returns the latest;
 * pass ?history=1 to get the full version list. Visibility is restricted
 * to roles holding `customers:read_edd_data` (mlro, senior_reviewer,
 * tenant_admin). Analysts and onboarding agents are intentionally blind.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'customers:read_edd_data');

    const { customerId } = await params;
    const wantHistory = new URL(request.url).searchParams.get('history') === '1';

    if (wantHistory) {
      const history = await listEddRecordHistory(customerId, auth.user.tenant_id);
      return NextResponse.json({ history });
    }

    const latest = await getLatestEddRecord(customerId, auth.user.tenant_id);
    return NextResponse.json({ record: latest });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    log.error('GET /api/edd/[customerId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Capture a new EDD record. Append-only — every successful POST creates a
 * new version row. Reviewers (MLRO / SR / tenant_admin) use this to
 * transcribe EDD data they collected via the existing RAI flow or other
 * channels. A future customer-facing EDD onboarding step will call the
 * same endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'customers:read_edd_data');

    const { customerId } = await params;
    const body = await request.json();
    const parsed = EddCaptureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await recordEdd({
      tenant_id: auth.user.tenant_id,
      customer_id: customerId,
      submitted_by: auth.user.id,
      actor_role: auth.user.role,
      ...parsed.data,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('does not belong to this customer') || msg.includes('could not be found')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    log.error('POST /api/edd/[customerId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
