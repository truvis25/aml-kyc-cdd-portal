import { createClient } from '@/lib/supabase/server';
import type { Business, BusinessDataVersion } from './kyb.types';
import type { KybBusinessInput } from '@/lib/validations/kyb';

export async function createBusiness(tenant_id: string, customer_id: string): Promise<Business> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .insert({ tenant_id, customer_id, status: 'pending', latest_version: 0 })
    .select()
    .single();

  if (error) throw new Error(`Failed to create business: ${error.message}`);
  return data as Business;
}

export async function getBusinessById(id: string, tenant_id: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch business: ${error.message}`);
  return data as Business | null;
}

export async function getBusinessByCustomerId(
  customer_id: string,
  tenant_id: string
): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch business by customer: ${error.message}`);
  return data as Business | null;
}

export async function appendBusinessData(
  business_id: string,
  tenant_id: string,
  fields: KybBusinessInput,
  changed_by: string
): Promise<BusinessDataVersion> {
  const supabase = await createClient();

  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('latest_version')
    .eq('id', business_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (fetchError) throw new Error(`Failed to fetch business version: ${fetchError.message}`);
  const next_version = ((business as { latest_version: number }).latest_version ?? 0) + 1;

  const { data, error } = await supabase
    .from('business_data_versions')
    .insert({
      business_id,
      tenant_id,
      version: next_version,
      changed_by,
      ...fields,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to append business data: ${error.message}`);

  await supabase
    .from('businesses')
    .update({ latest_version: next_version, status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', business_id)
    .eq('tenant_id', tenant_id);

  return data as BusinessDataVersion;
}

export async function getLatestBusinessData(
  business_id: string,
  tenant_id: string
): Promise<BusinessDataVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_data_versions')
    .select('*')
    .eq('business_id', business_id)
    .eq('tenant_id', tenant_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch business data: ${error.message}`);
  return data as BusinessDataVersion | null;
}

export async function updateBusinessStatus(
  business_id: string,
  tenant_id: string,
  status: Business['status']
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('businesses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', business_id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update business status: ${error.message}`);
}
