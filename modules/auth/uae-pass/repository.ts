/**
 * Persistence for uae_pass_authentications. Kept narrow on purpose so the
 * service layer can be unit-tested with a small mock surface.
 */

import { createClient } from '@/lib/supabase/server';
import type { UaePassUserInfo, UaePassAssuranceLevel } from './types';

export interface UaePassAuthenticationRow {
  id: string;
  tenant_id: string;
  onboarding_session_id: string;
  state: string;
  nonce: string;
  code_verifier: string;
  required_assurance_level: 'SOP2' | 'SOP3';
  status: 'initiated' | 'succeeded' | 'failed' | 'expired';
  subject: string | null;
  user_type: UaePassAssuranceLevel | null;
  claims: UaePassUserInfo | null;
  error_code: string | null;
  error_detail: string | null;
  initiated_at: string;
  completed_at: string | null;
}

export async function insertInitiatedAuthentication(params: {
  tenant_id: string;
  onboarding_session_id: string;
  state: string;
  nonce: string;
  code_verifier: string;
  required_assurance_level: 'SOP2' | 'SOP3';
}): Promise<UaePassAuthenticationRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uae_pass_authentications')
    .insert({
      tenant_id: params.tenant_id,
      onboarding_session_id: params.onboarding_session_id,
      state: params.state,
      nonce: params.nonce,
      code_verifier: params.code_verifier,
      required_assurance_level: params.required_assurance_level,
      status: 'initiated',
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Failed to insert uae_pass_authentications row: ${error?.message ?? 'unknown'}`);
  }
  return data as UaePassAuthenticationRow;
}

export async function loadAuthenticationByState(
  state: string,
): Promise<UaePassAuthenticationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uae_pass_authentications')
    .select('*')
    .eq('state', state)
    .maybeSingle();
  if (error) throw new Error(`Failed to load uae_pass_authentications by state: ${error.message}`);
  return (data as UaePassAuthenticationRow | null) ?? null;
}

export async function loadLatestSucceededAuthenticationForSession(
  onboarding_session_id: string,
  tenant_id: string,
): Promise<UaePassAuthenticationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uae_pass_authentications')
    .select('*')
    .eq('onboarding_session_id', onboarding_session_id)
    .eq('tenant_id', tenant_id)
    .eq('status', 'succeeded')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load latest succeeded uae_pass_authentications row: ${error.message}`);
  }
  return (data as UaePassAuthenticationRow | null) ?? null;
}

export async function markAuthenticationSucceeded(params: {
  id: string;
  tenant_id: string;
  subject: string;
  user_type: UaePassAssuranceLevel;
  claims: UaePassUserInfo;
}): Promise<UaePassAuthenticationRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uae_pass_authentications')
    .update({
      status: 'succeeded',
      subject: params.subject,
      user_type: params.user_type,
      claims: params.claims,
      completed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('tenant_id', params.tenant_id)
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Failed to mark uae_pass_authentications row succeeded: ${error?.message ?? 'unknown'}`);
  }
  return data as UaePassAuthenticationRow;
}

export async function markAuthenticationFailed(params: {
  id: string;
  tenant_id: string;
  error_code: string;
  error_detail: string;
}): Promise<UaePassAuthenticationRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uae_pass_authentications')
    .update({
      status: 'failed',
      error_code: params.error_code,
      error_detail: params.error_detail.slice(0, 2000),
      completed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('tenant_id', params.tenant_id)
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Failed to mark uae_pass_authentications row failed: ${error?.message ?? 'unknown'}`);
  }
  return data as UaePassAuthenticationRow;
}
