import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { WorkflowEngine } from './engine';
import { createSession } from './session.repository';
import { createCustomer, getLatestCustomerData } from '@/modules/kyc-individual/kyc.repository';
import { markSubmitted } from '@/modules/kyc-individual/kyc.service';
import { computeRiskScore, getLatestAssessment } from '@/modules/risk/risk.service';
import { initiateScreening } from '@/modules/screening/screening.service';
import { openCase, riskBandToQueue } from '@/modules/cases/cases.service';
import { getCaseBySessionId } from '@/modules/cases/cases.repository';
import { initiateBusiness } from '@/modules/kyb/kyb.service';
import { getBusinessByCustomerId, updateBusinessStatus } from '@/modules/kyb/kyb.repository';
import { updateCustomerStatus } from '@/modules/kyc-individual/kyc.repository';
import type { OnboardingSession, WorkflowStep, StepResult } from './onboarding.types';

export async function initiateSession(
  tenant_id: string,
  actor_id: string,
  customer_type: 'individual' | 'corporate' = 'individual'
): Promise<{ session: OnboardingSession; first_step: WorkflowStep }> {
  const { workflow_id, definition } = await WorkflowEngine.loadDefinition(tenant_id, customer_type);
  const first_step = WorkflowEngine.getFirstStep(definition);

  const customer = await createCustomer(tenant_id, customer_type);

  const step_data: Record<string, unknown> = { customer_type };

  if (customer_type === 'corporate') {
    const business = await initiateBusiness(tenant_id, customer.id, actor_id);
    step_data.business_id = business.id;
  }

  const session = await createSession({
    tenant_id,
    customer_id: customer.id,
    workflow_id,
    first_step: first_step.id,
    step_data,
  });

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.SESSION_INITIATED,
    entity_type: AuditEntityType.SESSION,
    entity_id: session.id,
    actor_id,
    payload: { customer_id: customer.id, workflow_id, customer_type },
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

  if (result.session.status === 'submitted') {
    await finalizeSubmittedSession(result.session, tenant_id, actor_id);
  }

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

async function finalizeSubmittedSession(
  session: OnboardingSession,
  tenant_id: string,
  actor_id: string
): Promise<void> {
  const customer_type = (session.step_data as { customer_type?: string })?.customer_type ?? 'individual';

  if (customer_type === 'corporate') {
    await finalizeSubmittedKybSession(session, tenant_id, actor_id);
    return;
  }

  await markSubmitted(session.customer_id, tenant_id, actor_id);

  const latestData = await getLatestCustomerData(session.customer_id, tenant_id);
  if (!latestData) {
    throw new Error(
      `Cannot finalize submission for customer ${session.customer_id} (session ${session.id}): customer identity data is missing`
    );
  }

  const existingAssessment = await getLatestAssessment(session.customer_id, tenant_id);
  const assessment = existingAssessment
    ? existingAssessment
    : await computeRiskScore(
        session.customer_id,
        tenant_id,
        {
          nationality: latestData.nationality ?? undefined,
          country_of_residence: latestData.country_of_residence ?? undefined,
          pep_status: latestData.pep_status,
          occupation: latestData.occupation ?? undefined,
          dual_nationality: latestData.dual_nationality,
        },
        actor_id
      );

  const screeningName = latestData.full_name?.trim();
  if (!screeningName) {
    throw new Error(
      `Cannot finalize submission for customer ${session.customer_id} (session ${session.id}): full_name is required for screening`
    );
  }

  await initiateScreening(
    {
      customer_id: session.customer_id,
      tenant_id,
      full_name: screeningName,
      date_of_birth: latestData.date_of_birth ?? undefined,
      nationality: latestData.nationality ?? undefined,
    },
    actor_id
  );

  const queue = riskBandToQueue(assessment.risk_band);
  if (!queue) return;

  const existingCase = await getCaseBySessionId(session.id, tenant_id);
  if (existingCase) return;

  await openCase(
    {
      tenant_id,
      customer_id: session.customer_id,
      session_id: session.id,
      risk_assessment_id: assessment.id,
      queue,
    },
    actor_id
  );
}

async function finalizeSubmittedKybSession(
  session: OnboardingSession,
  tenant_id: string,
  actor_id: string
): Promise<void> {
  // Mark customer as submitted
  await updateCustomerStatus(session.customer_id, tenant_id, 'submitted');

  // Mark the business record as submitted
  const business = await getBusinessByCustomerId(session.customer_id, tenant_id);
  if (business) {
    await updateBusinessStatus(business.id, tenant_id, 'submitted');
  }

  // Corporate KYB goes directly to a standard manual review case (no automated screening in MVP)
  const existingCase = await getCaseBySessionId(session.id, tenant_id);
  if (existingCase) return;

  await openCase(
    {
      tenant_id,
      customer_id: session.customer_id,
      session_id: session.id,
      risk_assessment_id: undefined,
      queue: 'standard',
    },
    actor_id
  );
}
