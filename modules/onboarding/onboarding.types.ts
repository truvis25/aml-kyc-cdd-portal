export type SessionStatus =
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface OnboardingSession {
  id: string;
  tenant_id: string;
  customer_id: string;
  workflow_id: string | null;
  status: SessionStatus;
  current_step: string;
  completed_steps: string[];
  step_data: Record<string, unknown>;
  token: string | null;
  token_expires_at: string | null;
  started_at: string;
  last_activity_at: string;
  submitted_at: string | null;
  expires_at: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  type: 'consent' | 'kyc_form' | 'document_upload' | 'completion';
  required: boolean;
  fields?: string[];
  document_requirements?: DocumentRequirement[];
  next: string | null;
}

export interface DocumentRequirement {
  type: string;
  label: string;
  required: boolean;
  alternatives?: string[];
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  customer_type: string;
  steps: WorkflowStep[];
}

export interface StepResult {
  step_id: string;
  data?: Record<string, unknown>;
}
