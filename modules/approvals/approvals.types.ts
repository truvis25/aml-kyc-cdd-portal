export interface Approval {
  id: string;
  tenant_id: string;
  case_id: string;
  decision: 'approved' | 'rejected';
  rationale: string;
  decided_by: string;
  decided_at: string;
  requires_second_approval: boolean;
  second_approver: string | null;
  second_decided_at: string | null;
}

export interface RecordApprovalParams {
  tenant_id: string;
  case_id: string;
  decision: 'approved' | 'rejected';
  rationale: string;
  decided_by: string;
  requires_second_approval?: boolean;
}
