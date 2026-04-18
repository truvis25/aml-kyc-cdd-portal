export type RiskBand = 'low' | 'medium' | 'high' | 'unacceptable';

export interface RiskFactor {
  factor: string;
  score: number;
  weight: number;
  reason: string;
}

export interface RiskDimensionResult {
  dimension: string;
  score: number;
  weight: number;
  factors: RiskFactor[];
}

export interface RiskAssessment {
  id: string;
  tenant_id: string;
  customer_id: string;
  composite_score: number;
  risk_band: RiskBand;
  customer_score: number;
  geographic_score: number;
  product_score: number;
  factor_breakdown: Record<string, RiskDimensionResult>;
  version: number;
  assessed_at: string;
  assessed_by: string;
}

export interface RiskInput {
  entity_type?: string;
  nationality?: string;
  pep_status?: boolean;
  occupation?: string;
  dual_nationality?: string | null;
  country_of_residence?: string;
  product_type?: string;
  expected_transaction_volume?: string;
}

export const FATF_HIGH_RISK = new Set(['KP', 'IR']);
export const FATF_MONITORED = new Set(['MM', 'YE', 'SY', 'SD', 'SO', 'LY', 'IQ', 'AF']);
