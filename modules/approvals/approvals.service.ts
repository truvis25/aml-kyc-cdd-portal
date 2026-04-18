import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { insertApproval, getApprovalByCaseId } from './approvals.repository';
import { updateCaseStatus, appendCaseEvent } from '@/modules/cases/cases.repository';
import type { Approval, RecordApprovalParams } from './approvals.types';

export async function recordDecision(
  params: RecordApprovalParams,
  actor_role: string
): Promise<Approval> {
  const existing = await getApprovalByCaseId(params.case_id, params.tenant_id);
  if (existing) throw new Error('A decision has already been recorded for this case');

  const approval = await insertApproval(params);

  await updateCaseStatus(
    params.case_id,
    params.tenant_id,
    params.decision === 'approved' ? 'approved' : 'rejected'
  );

  await appendCaseEvent({
    tenant_id: params.tenant_id,
    case_id: params.case_id,
    event_type: params.decision === 'approved' ? 'approved' : 'rejected',
    actor_id: params.decided_by,
    actor_role,
    payload: { rationale: params.rationale, approval_id: approval.id },
  });

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: params.decision === 'approved' ? AuditEventType.APPROVAL_GRANTED : AuditEventType.APPROVAL_REJECTED,
    entity_type: AuditEntityType.APPROVAL,
    entity_id: approval.id,
    actor_id: params.decided_by,
    actor_role,
    payload: { case_id: params.case_id, decision: params.decision },
  });

  return approval;
}

export async function getDecision(case_id: string, tenant_id: string): Promise<Approval | null> {
  return getApprovalByCaseId(case_id, tenant_id);
}
