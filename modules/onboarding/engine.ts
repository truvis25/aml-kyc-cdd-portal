import { getWorkflowDefinition, getSessionById, advanceSession } from './session.repository';
import type { WorkflowDefinition, WorkflowStep, StepResult, OnboardingSession } from './onboarding.types';

export class WorkflowEngine {
  static parseDefinition(raw: Record<string, unknown>): WorkflowDefinition {
    return raw as unknown as WorkflowDefinition;
  }

  static async loadDefinition(
    tenant_id: string,
    customer_type: string
  ): Promise<{ workflow_id: string; definition: WorkflowDefinition }> {
    const row = await getWorkflowDefinition(tenant_id, customer_type);
    if (!row) throw new Error(`No active workflow found for customer_type: ${customer_type}`);
    return {
      workflow_id: row.id,
      definition: WorkflowEngine.parseDefinition(row.definition as Record<string, unknown>),
    };
  }

  static getFirstStep(definition: WorkflowDefinition): WorkflowStep {
    const first = definition.steps[0];
    if (!first) throw new Error('Workflow has no steps');
    return first;
  }

  static getStep(definition: WorkflowDefinition, step_id: string): WorkflowStep | null {
    return definition.steps.find((s) => s.id === step_id) ?? null;
  }

  static getNextStep(definition: WorkflowDefinition, current_step_id: string): WorkflowStep | null {
    const current = WorkflowEngine.getStep(definition, current_step_id);
    if (!current || current.next === null) return null;
    return WorkflowEngine.getStep(definition, current.next);
  }

  static async getCurrentStep(
    session_id: string,
    tenant_id: string
  ): Promise<{ session: OnboardingSession; step: WorkflowStep | null }> {
    const session = await getSessionById(session_id, tenant_id);
    if (!session) throw new Error('Session not found');

    if (!session.workflow_id) return { session, step: null };

    const row = await getWorkflowDefinition(tenant_id, 'individual');
    if (!row) return { session, step: null };

    const definition = WorkflowEngine.parseDefinition(row.definition as Record<string, unknown>);
    const step = WorkflowEngine.getStep(definition, session.current_step);
    return { session, step };
  }

  static async advance(
    session_id: string,
    tenant_id: string,
    step_result: StepResult
  ): Promise<{ session: OnboardingSession; next_step: WorkflowStep | null }> {
    const session = await getSessionById(session_id, tenant_id);
    if (!session) throw new Error('Session not found');
    if (session.status === 'submitted' || session.status === 'approved') {
      throw new Error('Session is already complete');
    }

    const row = await getWorkflowDefinition(tenant_id, 'individual');
    if (!row) throw new Error('No workflow found');

    const definition = WorkflowEngine.parseDefinition(row.definition as Record<string, unknown>);
    const current = WorkflowEngine.getStep(definition, step_result.step_id);
    if (!current) throw new Error(`Step not found: ${step_result.step_id}`);

    const next = current.next ? WorkflowEngine.getStep(definition, current.next) : null;

    const updated = await advanceSession(
      session_id,
      tenant_id,
      step_result.step_id,
      next?.id ?? null
    );

    return { session: updated, next_step: next };
  }

  static isComplete(session: OnboardingSession, definition: WorkflowDefinition): boolean {
    const required_steps = definition.steps
      .filter((s) => s.required)
      .map((s) => s.id);
    return required_steps.every((id) => session.completed_steps.includes(id));
  }
}
