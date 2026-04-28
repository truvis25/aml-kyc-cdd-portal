export interface MonthlyVolumeRow {
  month: string; // 'YYYY-MM'
  received: number;
  completed: number;
  abandoned: number;
}

export interface MonthlyApprovalRow {
  month: string; // 'YYYY-MM'
  approved: number;
  rejected: number;
  pending: number;
}

export interface AvgTimeToDecisionRow {
  risk_band: string;
  avg_days: number;
  decisions: number;
}

export interface RiskBandRow {
  risk_band: string;
  count: number;
}

export interface DocTypeRow {
  document_type: string;
  count: number;
}

export interface ScreeningHitRate {
  cases_total: number;
  cases_with_hits: number;
  rate: number; // 0..1
}
