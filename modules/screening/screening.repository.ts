import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import type { ScreeningJob, ScreeningHit } from './screening.types';

export async function createScreeningJob(params: {
  tenant_id: string;
  customer_id: string;
  provider: string;
  external_job_id?: string;
  requested_by: string;
}): Promise<ScreeningJob> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('screening_jobs')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      provider: params.provider,
      external_job_id: params.external_job_id ?? null,
      requested_by: params.requested_by,
      status: 'running',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create screening job: ${error.message}`);
  return data as ScreeningJob;
}

export async function updateScreeningJob(
  job_id: string,
  tenant_id: string,
  status: ScreeningJob['status'],
  external_job_id?: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('screening_jobs')
    .update({
      status,
      external_job_id: external_job_id ?? undefined,
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
    })
    .eq('id', job_id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to update screening job: ${error.message}`);
}

export async function insertScreeningHits(
  job_id: string,
  customer_id: string,
  tenant_id: string,
  hits: Omit<ScreeningHit, 'id'>[]
): Promise<void> {
  if (hits.length === 0) return;
  const supabase = createAdminClient();

  const rows = hits.map((h) => ({
    tenant_id,
    job_id,
    customer_id,
    hit_type: h.hit_type,
    match_name: h.match_name,
    match_score: h.match_score,
    raw_data: h.raw_data as unknown as Json,
    status: 'pending' as const,
  }));

  const { error } = await supabase.from('screening_hits').insert(rows);
  if (error) throw new Error(`Failed to insert screening hits: ${error.message}`);
}

export async function getScreeningJobById(job_id: string, tenant_id: string): Promise<ScreeningJob | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('screening_jobs')
    .select('*')
    .eq('id', job_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch screening job: ${error.message}`);
  return data as ScreeningJob | null;
}

export async function getHitsByJobId(job_id: string, tenant_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('screening_hits')
    .select('*')
    .eq('job_id', job_id)
    .eq('tenant_id', tenant_id);

  if (error) throw new Error(`Failed to fetch hits: ${error.message}`);
  return data ?? [];
}
