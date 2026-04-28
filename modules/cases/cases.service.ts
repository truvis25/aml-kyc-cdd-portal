import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import {
  createCase,
  getCaseById,
  listCases,
  updateCaseStatus,
  appendCaseEvent,
  getCaseEvents,
} from './cases.repository';
import type { Case, CaseEvent, CreateCaseParams, CaseQueue } from './cases.types';
import type { RiskBand } from '@/modules/risk/risk.types';

export function riskBandToQueue(risk_band: RiskBand): CaseQueue | null {
  switch (risk_band) {
    case 'low': return null;
    case 'medium': return 'standard';
    case 'high': return 'edd';
    case 'unacceptable': return 'escalation';
  }
}

export async function openCase(
  params: CreateCaseParams,
  actor_id: string
): Promise<Case> {
  const case_ = await createCase(params);

  await appendCaseEvent({
    tenant_id: params.tenant_id,
    case_id: case_.id,
    event_type: 'case_opened',
    actor_id,
    actor_role: 'system',
    payload: { queue: params.queue, risk_assessment_id: params.risk_assessment_id },
  });

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.CASE_CREATED,
    entity_type: AuditEntityType.CASE,
    entity_id: case_.id,
    actor_id,
    payload: { customer_id: params.customer_id, queue: params.queue },
  });

  return case_;
}

export async function getCaseDetail(
  case_id: string,
  tenant_id: string
): Promise<{ case: Case; events: CaseEvent[] }> {
  const case_ = await getCaseById(case_id, tenant_id);
  if (!case_) throw new Error('Case not found');

  const events = await getCaseEvents(case_id, tenant_id);
  return { case: case_, events };
}

export async function addNote(
  case_id: string,
  tenant_id: string,
  note: string,
  actor_id: string,
  actor_role: string
): Promise<CaseEvent> {
  const case_ = await getCaseById(case_id, tenant_id);
  if (!case_) throw new Error('Case not found');

  const event = await appendCaseEvent({
    tenant_id,
    case_id,
    event_type: 'note',
    actor_id,
    actor_role,
    payload: { note },
  });

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.CASE_NOTE_ADDED,
    entity_type: AuditEntityType.CASE,
    entity_id: case_id,
    actor_id,
    actor_role,
    payload: { case_id },
  });

  return event;
}

export async function escalateCase(
  case_id: string,
  tenant_id: string,
  reason: string,
  actor_id: string,
  actor_role: string
): Promise<void> {
  await updateCaseStatus(case_id, tenant_id, 'escalated');
  await appendCaseEvent({
    tenant_id,
    case_id,
    event_type: 'escalated',
    actor_id,
    actor_role,
    payload: { reason },
  });
  await audit.emit({
    tenant_id,
    event_type: AuditEventType.CASE_ESCALATED,
    entity_type: AuditEntityType.CASE,
    entity_id: case_id,
    actor_id,
    actor_role,
    payload: { reason },
  });
}

export interface RaiParams {
  case_id: string;
  tenant_id: string;
  info_requested: string;
  documents_required?: string[];
  actor_id: string;
  actor_role: string;
}

export interface RaiResult {
  case: Case;
  event: CaseEvent;
}

/**
 * Records a request-for-additional-information on a case. Updates status
 * to 'pending_info', appends a case event, emits the audit log entry, and
 * returns the (now-pending) case + the new event so the caller can dispatch
 * the customer email side-effect.
 */
export async function requestAdditionalInfo(params: RaiParams): Promise<RaiResult> {
  const case_ = await getCaseById(params.case_id, params.tenant_id);
  if (!case_) throw new Error('Case not found');

  await updateCaseStatus(params.case_id, params.tenant_id, 'pending_info');

  const event = await appendCaseEvent({
    tenant_id: params.tenant_id,
    case_id: params.case_id,
    event_type: 'request_additional_info',
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    payload: {
      info_requested: params.info_requested,
      documents_required: params.documents_required ?? [],
    },
  });

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.CASE_RAI_SENT,
    entity_type: AuditEntityType.CASE,
    entity_id: params.case_id,
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    payload: {
      // PII rule: never log the literal info_requested text in audit_log
      // (could contain customer-identifying questions). Record only structural
      // metadata; the case_event row holds the literal request body.
      documents_required_count: params.documents_required?.length ?? 0,
      customer_id: case_.customer_id,
    },
  });

  return { case: case_, event };
}

export async function getCaseList(
  tenant_id: string,
  role: string,
  actor_id: string,
  filters: { queue?: string; status?: string }
) {
  const assigned_to =
    role === 'analyst' || role === 'senior_reviewer' ? actor_id : undefined;
  return listCases(tenant_id, { ...filters, assigned_to });
}
