import { createClient } from '@/lib/supabase/server';
import type { Customer, CustomerDataVersion } from './kyc.types';
import type { KycIdentityInput } from '@/lib/validations/kyc';

export async function createCustomer(
  tenant_id: string,
  customer_type: 'individual' | 'corporate' = 'individual'
): Promise<Customer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .insert({ tenant_id, customer_type, status: 'pending', latest_version: 0 })
    .select()
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return data as Customer;
}

export async function getCustomerById(id: string, tenant_id: string): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch customer: ${error.message}`);
  return data as Customer | null;
}

export async function appendCustomerData(
  customer_id: string,
  tenant_id: string,
  fields: Partial<KycIdentityInput>,
  submitted_by: string
): Promise<CustomerDataVersion> {
  const supabase = await createClient();

  // Get next version number atomically
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('latest_version')
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (fetchError) throw new Error(`Failed to fetch customer version: ${fetchError.message}`);
  const customerRow = customer as { latest_version: number | null };

  const next_version = (customerRow.latest_version ?? 0) + 1;

  const { data, error } = await supabase
    .from('customer_data_versions')
    .insert({
      customer_id,
      tenant_id,
      version: next_version,
      submitted_by,
      ...fields,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to append customer data: ${error.message}`);

  // Update latest_version pointer and status
  await supabase
    .from('customers')
    .update({ latest_version: next_version, status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id);

  return data as CustomerDataVersion;
}

export async function getLatestCustomerData(
  customer_id: string,
  tenant_id: string
): Promise<CustomerDataVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customer_data_versions')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch customer data: ${error.message}`);
  return data as CustomerDataVersion | null;
}

export async function updateCustomerStatus(
  customer_id: string,
  tenant_id: string,
  status: Customer['status']
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('customers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update customer status: ${error.message}`);
}
