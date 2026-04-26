import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { recordDecision } from '@/modules/approvals/approvals.service';

const ApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rationale: z.string().min(20, 'Rationale must be at least 20 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:approve_standard');

    const { caseId } = await params;
    const body = await request.json();
    const parsed = ApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const approval = await recordDecision(
      {
        tenant_id: auth.user.tenant_id,
        case_id: caseId,
        decision: parsed.data.decision,
        rationale: parsed.data.rationale,
        decided_by: auth.user.id,
      },
      auth.user.role
    );

    return NextResponse.json({ approval }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('already been recorded')) return NextResponse.json({ error: msg }, { status: 409 });
    console.error('POST /api/approvals/[caseId] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
