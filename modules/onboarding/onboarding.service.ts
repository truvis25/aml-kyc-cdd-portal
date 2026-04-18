import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { WorkflowEngine } from './engine';
import { createSession } from './session.repository';
import { createCustomer } from '@/modules/kyc-individual/kyc.repository';
import type { OnboardingSession, WorkflowStep, StepResult } from './onboarding.types';

export async function initiateSession(
  tenant_id: string,
  actor_id: string
): Promise<{ session: OnboardingSession; first_step: WorkflowStep }> {
  const { workflow_id, definition } = await WorkflowEngine.loadDefinition(tenant_id, 'individual');
  const first_step = WorkflowEngine.getFirstStep(definition);

  const customer = await createCustomer(tenant_id, 'individual');

  const session = await createSession({
    tenant_id,
    customer_id: customer.id,
    workflow_id,
    first_step: first_step.id,
  });

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.SESSION_INITIATED,
    entity_type: AuditEntityType.SESSION,
    entity_id: session.id,
    actor_id,
    payload: { customer_id: customer.id, workflow_id },
  });

  return { session, first_step };
}

export async function getSessionState(
  session_id: string,
  tenant_id: string
): Promise<{ session: OnboardingSession; current_step: WorkflowStep | null }> {
  const { session, step } = await WorkflowEngine.getCurrentStep(session_id, tenant_id);
  return { session, current_step: step };
}

export async function submitStep(
  session_id: string,
  tenant_id: string,
  step_result: StepResult,
  actor_id: string
): Promise<{ session: OnboardingSession; next_step: WorkflowStep | null }> {
  const result = await WorkflowEngine.advance(session_id, tenant_id, step_result);

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.SESSION_STEP_SUBMITTED,
    entity_type: AuditEntityType.SESSION,
    entity_id: session_id,
    actor_id,
    payload: { step_id: step_result.step_id, next_step: result.next_step?.id ?? null },
  });

  return result;
}
