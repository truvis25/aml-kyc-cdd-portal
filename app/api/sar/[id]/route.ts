import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getSarReport, updateSarDraft, UpdateSarDraftSchema } from '@/modules/sar';
import { log } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { id } = await ctx.params;
    const report = await getSarReport(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      id,
    );
    if (!report) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('GET /api/sar/[id] error', { code: 'sar_get_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { id } = await ctx.params;
    const body = await request.json();
    const patch = UpdateSarDraftSchema.parse(body);

    const report = await updateSarDraft(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      id,
      patch,
    );
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: err.issues }, { status: 400 });
    }
    log.error('PATCH /api/sar/[id] error', { code: 'sar_update_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
