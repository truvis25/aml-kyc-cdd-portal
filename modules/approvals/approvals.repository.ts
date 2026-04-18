import { createClient } from '@/lib/supabase/server';
import type { Approval, RecordApprovalParams } from './approvals.types';

export async function insertApproval(params: RecordApprovalParams): Promise<Approval> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('approvals')
    .insert({
      tenant_id: params.tenant_id,
      case_id: params.case_id,
      decision: params.decision,
      rationale: params.rationale,
      decided_by: params.decided_by,
      requires_second_approval: params.requires_second_approval ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record approval: ${error.message}`);
  return data as Approval;
}

export async function getApprovalByCaseId(
  case_id: string,
  tenant_id: string
): Promise<Approval | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('approvals')
    .select('*')
    .eq('case_id', case_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch approval: ${error.message}`);
  return data as Approval | null;
}
