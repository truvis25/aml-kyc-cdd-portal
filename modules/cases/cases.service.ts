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
