import { createAdminClient } from '@/lib/supabase/admin';
import type { RiskAssessment } from './risk.types';

export async function insertRiskAssessment(params: Omit<RiskAssessment, 'id' | 'assessed_at'>): Promise<RiskAssessment> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('risk_assessments')
    .insert({
      tenant_id: params.tenant_id,
      customer_id: params.customer_id,
      composite_score: params.composite_score,
      risk_band: params.risk_band,
      customer_score: params.customer_score,
      geographic_score: params.geographic_score,
      product_score: params.product_score,
      factor_breakdown: params.factor_breakdown,
      version: params.version,
      assessed_by: params.assessed_by,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert risk assessment: ${error.message}`);
  return data as RiskAssessment;
}

export async function getLatestRiskAssessment(
  customer_id: string,
  tenant_id: string
): Promise<RiskAssessment | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch risk assessment: ${error.message}`);
  return data as RiskAssessment | null;
}
