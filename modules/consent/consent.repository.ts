import { createClient } from '@/lib/supabase/server';
import type { CaptureConsentParams, ConsentRecord } from './consent.types';

export async function insertConsentRecord(params: CaptureConsentParams): Promise<ConsentRecord> {
  const supabase = await createClient();

  // Mask IP to /24
  const maskedIp = params.ip_address ? maskIp(params.ip_address) : null;

  const { data, error } = await supabase
    .from('consent_records')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      data_processing: params.data_processing,
      aml_screening: params.aml_screening,
      identity_verification: params.identity_verification,
      third_party_sharing: params.third_party_sharing,
      ip_address: maskedIp,
      user_agent: params.user_agent ?? null,
      consent_version: params.consent_version ?? '1.0',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert consent record: ${error.message}`);
  return data as ConsentRecord;
}

export async function getLatestConsent(
  customer_id: string,
  tenant_id: string
): Promise<ConsentRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('consent_records')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch consent: ${error.message}`);
  return data as ConsentRecord | null;
}

function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[3] = '0';
    return parts.join('.');
  }
  return ip.replace(/:[0-9a-fA-F]*$/, ':0');
}
