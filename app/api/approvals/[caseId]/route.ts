import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission, PermissionDeniedError } from '@/modules/auth/rbac';
import { recordDecision } from '@/modules/approvals/approvals.service';
import { getCaseById } from '@/modules/cases/cases.repository';
import { sendApprovalEmail, sendRejectionEmail } from '@/modules/notifications';
import { log } from '@/lib/logger';

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

    // Dispatch the customer notification AFTER the approval is durably written.
    // Email send is best-effort; result is recorded in notification_events
    // regardless of success/failure.
    let emailResult = { ok: false, error: 'no_case' as string | null | undefined };
    const case_ = await getCaseById(caseId, auth.user.tenant_id);
    if (case_) {
      const send = parsed.data.decision === 'approved' ? sendApprovalEmail : sendRejectionEmail;
      const result = await send({
        tenantId: auth.user.tenant_id,
        caseId,
        customerId: case_.customer_id,
        actorId: auth.user.id,
        actorRole: auth.user.role,
      });
      emailResult = { ok: result.ok, error: result.error ?? null };
    }

    return NextResponse.json(
      { approval, email: emailResult },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('already been recorded')) return NextResponse.json({ error: msg }, { status: 409 });
    log.error('POST /api/approvals/[caseId] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
