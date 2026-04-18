export type ScreeningProvider = 'complyadvantage' | 'mock';
export type HitType = 'pep' | 'sanction' | 'adverse_media' | 'watchlist';
export type HitResolution = 'confirmed_match' | 'false_positive' | 'escalated';

export interface ScreeningParams {
  customer_id: string;
  tenant_id: string;
  full_name: string;
  date_of_birth?: string;
  nationality?: string;
  search_type?: 'individual' | 'corporate';
}

export interface ScreeningHit {
  hit_type: HitType;
  match_name: string;
  match_score: number;
  raw_data: Record<string, unknown>;
}

export interface ScreeningResult {
  job_id: string;
  external_job_id?: string;
  status: 'completed' | 'failed';
  hits: ScreeningHit[];
  completed_at: string;
}

export interface ScreeningJob {
  id: string;
  tenant_id: string;
  customer_id: string;
  provider: string;
  external_job_id: string | null;
  search_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  requested_at: string;
  completed_at: string | null;
}

export interface ScreeningAdapter {
  submitScreening(params: ScreeningParams): Promise<{ job_id: string }>;
  getResults(job_id: string): Promise<ScreeningResult>;
  parseWebhook(body: unknown, signature: string): Promise<ScreeningResult>;
}
