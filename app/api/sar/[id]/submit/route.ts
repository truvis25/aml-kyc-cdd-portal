import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { submitSarReport } from '@/modules/sar';
import { log } from '@/lib/logger';

const SubmitSchema = z.object({
  submission_id: z.string().trim().max(120).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { id } = await ctx.params;
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // empty body is acceptable
    }
    const parsed = SubmitSchema.parse(body ?? {});

    const report = await submitSarReport(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      id,
      parsed.submission_id,
    );
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: err.issues }, { status: 400 });
    }
    log.error('POST /api/sar/[id]/submit error', { code: 'sar_submit_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
