import { createClient } from '@/lib/supabase/server';
import type { CreateEddRecordParams, EddRecord } from './edd.types';

/**
 * Returns the latest (highest version) EDD record for a customer, or
 * null if none exists. RLS gates the result to roles with
 * customers:read_edd_data.
 */
export async function getLatestEddRecord(
  customerId: string,
  tenantId: string,
): Promise<EddRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_edd_records')
    .select('*')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch EDD record: ${error.message}`);
  return (data as EddRecord | null) ?? null;
}

/**
 * Returns the full version history for a customer, oldest first.
 */
export async function listEddRecordHistory(
  customerId: string,
  tenantId: string,
): Promise<EddRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_edd_records')
    .select('*')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('version', { ascending: true });
  if (error) throw new Error(`Failed to list EDD history: ${error.message}`);
  return (data as EddRecord[] | null) ?? [];
}

/**
 * Inserts a new EDD record for a customer. The version is `current_max + 1`
 * (or 1 if none exists). The append-only trigger blocks UPDATEs and DELETEs.
 */
export async function insertEddRecord(
  params: Omit<CreateEddRecordParams, 'actor_role'>,
): Promise<EddRecord> {
  const supabase = await createClient();

  const latest = await getLatestEddRecord(params.customer_id, params.tenant_id);
  const nextVersion = (latest?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from('customer_edd_records')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      version: nextVersion,
      source_of_wealth_narrative: params.source_of_wealth_narrative,
      source_of_funds_narrative: params.source_of_funds_narrative,
      expected_annual_volume_aed: params.expected_annual_volume_aed,
      expected_currencies: params.expected_currencies,
      expected_counterparties: params.expected_counterparties,
      expected_payment_methods: params.expected_payment_methods,
      pep_relationship_details: params.pep_relationship_details,
      supporting_document_ids: params.supporting_document_ids,
      reviewer_rationale: params.reviewer_rationale,
      submitted_by: params.submitted_by,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert EDD record: ${error.message}`);
  return data as EddRecord;
}
