import { createAdminClient } from '@/lib/supabase/admin';
import type { OnboardingSession } from './onboarding.types';

export async function createSession(params: {
  tenant_id: string;
  customer_id: string;
  workflow_id: string;
  first_step: string;
}): Promise<OnboardingSession> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('onboarding_sessions')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      workflow_id: params.workflow_id,
      status: 'in_progress',
      current_step: params.first_step,
      completed_steps: [],
      step_data: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data as OnboardingSession;
}

export async function getSessionById(id: string, tenant_id: string): Promise<OnboardingSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch session: ${error.message}`);
  return data as OnboardingSession | null;
}

export async function advanceSession(
  session_id: string,
  tenant_id: string,
  completed_step: string,
  next_step: string | null,
  new_status?: OnboardingSession['status']
): Promise<OnboardingSession> {
  const supabase = createAdminClient();

  const session = await getSessionById(session_id, tenant_id);
  if (!session) throw new Error('Session not found');

  const completed_steps = [...new Set([...session.completed_steps, completed_step])];
  const status = new_status ?? (next_step === null ? 'submitted' : 'in_progress');

  const { data, error } = await supabase
    .from('onboarding_sessions')
    .update({
      current_step: next_step ?? completed_step,
      completed_steps,
      status,
      last_activity_at: new Date().toISOString(),
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    })
    .eq('id', session_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to advance session: ${error.message}`);
  return data as OnboardingSession;
}

export async function getWorkflowDefinition(
  tenant_id: string,
  customer_type: string
): Promise<{ id: string; definition: Record<string, unknown> } | null> {
  const supabase = createAdminClient();

  // Prefer tenant-specific, fall back to platform default
  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('id, definition')
    .eq('customer_type', customer_type)
    .eq('is_active', true)
    .or(`tenant_id.eq.${tenant_id},tenant_id.is.null`)
    .order('tenant_id', { ascending: false }) // tenant-specific first (non-null sorts after null)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch workflow: ${error.message}`);
  return data as { id: string; definition: Record<string, unknown> } | null;
}
