export type CaseQueue = 'standard' | 'edd' | 'escalation' | 'senior';
export type CaseStatus =
  | 'open'
  | 'in_review'
  | 'pending_info'
  | 'escalated'
  | 'approved'
  | 'rejected'
  | 'closed';

export interface Case {
  id: string;
  tenant_id: string;
  customer_id: string;
  session_id: string | null;
  risk_assessment_id: string | null;
  queue: CaseQueue;
  status: CaseStatus;
  assigned_to: string | null;
  sar_flagged: boolean;
  opened_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface CaseEvent {
  id: string;
  tenant_id: string;
  case_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CreateCaseParams {
  tenant_id: string;
  customer_id: string;
  session_id?: string;
  risk_assessment_id?: string;
  queue: CaseQueue;
}

export interface AddCaseEventParams {
  tenant_id: string;
  case_id: string;
  event_type: string;
  actor_id: string;
  actor_role: string;
  payload?: Record<string, unknown>;
}
