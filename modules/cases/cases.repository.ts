import { createAdminClient } from '@/lib/supabase/admin';
import type { Case, CaseEvent, CreateCaseParams, AddCaseEventParams } from './cases.types';

export async function createCase(params: CreateCaseParams): Promise<Case> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('cases')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      session_id: params.session_id ?? null,
      risk_assessment_id: params.risk_assessment_id ?? null,
      queue: params.queue,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create case: ${error.message}`);
  return data as Case;
}

export async function getCaseById(id: string, tenant_id: string): Promise<Case | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch case: ${error.message}`);
  return data as Case | null;
}

export async function listCases(
  tenant_id: string,
  filters: { assigned_to?: string; queue?: string; status?: string }
): Promise<Case[]> {
  const supabase = createAdminClient();

  let q = supabase
    .from('cases')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('opened_at', { ascending: false });

  if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
  if (filters.queue) q = q.eq('queue', filters.queue);
  if (filters.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) throw new Error(`Failed to list cases: ${error.message}`);
  return (data ?? []) as Case[];
}

export async function updateCaseStatus(
  id: string,
  tenant_id: string,
  status: Case['status'],
  assigned_to?: string
): Promise<void> {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (assigned_to !== undefined) update.assigned_to = assigned_to;
  if (status === 'approved' || status === 'rejected' || status === 'closed') {
    update.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('cases')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update case status: ${error.message}`);
}

export async function appendCaseEvent(params: AddCaseEventParams): Promise<CaseEvent> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('case_events')
    .insert({
      tenant_id: params.tenant_id,
      case_id: params.case_id,
      event_type: params.event_type,
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      payload: params.payload ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to append case event: ${error.message}`);
  return data as CaseEvent;
}

export async function getCaseEvents(case_id: string, tenant_id: string): Promise<CaseEvent[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', case_id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch case events: ${error.message}`);
  return (data ?? []) as CaseEvent[];
}
