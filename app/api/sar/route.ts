import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createSarDraft, listSarReports, CreateSarDraftSchema, SAR_STATUSES } from '@/modules/sar';
import type { SarStatus } from '@/modules/sar';
import { log } from '@/lib/logger';

const ListQuerySchema = z.object({
  status: z.enum(SAR_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { searchParams } = new URL(request.url);
    const parsed = ListQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    const result = await listSarReports(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      { status: parsed.status as SarStatus | undefined, limit: parsed.limit, offset: parsed.offset },
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_query', details: err.issues }, { status: 400 });
    }
    log.error('GET /api/sar error', { code: 'sar_list_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const body = await request.json();
    const input = CreateSarDraftSchema.parse(body);

    const report = await createSarDraft(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      input,
    );

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: err.issues }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes('Case not found')) {
      return NextResponse.json({ error: 'case_not_found' }, { status: 404 });
    }
    log.error('POST /api/sar error', { code: 'sar_create_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
