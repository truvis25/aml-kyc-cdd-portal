import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type {
  AvgTimeToDecisionRow,
  DocTypeRow,
  MonthlyApprovalRow,
  MonthlyVolumeRow,
  RiskBandRow,
  ScreeningHitRate,
} from '@/modules/reporting/types';

type DB = SupabaseClient<Database>;

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function rangeStartIso(monthsBack: number): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + 1, 1));
  return start.toISOString();
}

/**
 * Onboarding sessions grouped by month, split by terminal status.
 * received   = total sessions started
 * completed  = sessions in 'submitted' or 'approved'
 * abandoned  = sessions in 'expired'
 */
export async function getMonthlyOnboardingVolume(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<MonthlyVolumeRow[]> {
  const sinceIso = rangeStartIso(monthsBack);
  const { data } = await supabase
    .from('onboarding_sessions')
    .select('started_at, status')
    .eq('tenant_id', tenantId)
    .gte('started_at', sinceIso);

  const buckets = new Map<string, MonthlyVolumeRow>();
  for (const row of (data ?? []) as { started_at: string; status: string }[]) {
    const key = monthKey(new Date(row.started_at));
    const bucket =
      buckets.get(key) ?? { month: key, received: 0, completed: 0, abandoned: 0 };
    bucket.received += 1;
    if (row.status === 'submitted' || row.status === 'approved') bucket.completed += 1;
    else if (row.status === 'expired') bucket.abandoned += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Cases grouped by month opened and split by current decision state.
 */
export async function getApprovalRateByMonth(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<MonthlyApprovalRow[]> {
  const sinceIso = rangeStartIso(monthsBack);
  const { data } = await supabase
    .from('cases')
    .select('opened_at, status')
    .eq('tenant_id', tenantId)
    .gte('opened_at', sinceIso);

  const buckets = new Map<string, MonthlyApprovalRow>();
  for (const row of (data ?? []) as { opened_at: string; status: string }[]) {
    const key = monthKey(new Date(row.opened_at));
    const bucket =
      buckets.get(key) ?? { month: key, approved: 0, rejected: 0, pending: 0 };
    if (row.status === 'approved') bucket.approved += 1;
    else if (row.status === 'rejected') bucket.rejected += 1;
    else bucket.pending += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export async function getAvgTimeToDecision(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<AvgTimeToDecisionRow[]> {
  const sinceIso = rangeStartIso(monthsBack);
  const { data } = await supabase
    .from('cases')
    .select('opened_at, closed_at, risk_assessment_id')
    .eq('tenant_id', tenantId)
    .not('closed_at', 'is', null)
    .gte('opened_at', sinceIso);

  const rows = (data ?? []) as {
    opened_at: string;
    closed_at: string | null;
    risk_assessment_id: string | null;
  }[];
  if (rows.length === 0) return [];

  const riskIds = [
    ...new Set(rows.map((r) => r.risk_assessment_id).filter(Boolean)),
  ] as string[];
  const bandById = new Map<string, string>();
  if (riskIds.length > 0) {
    const { data: risks } = await supabase
      .from('risk_assessments')
      .select('id, risk_band')
      .in('id', riskIds);
    for (const r of (risks ?? []) as { id: string; risk_band: string }[]) {
      bandById.set(r.id, r.risk_band);
    }
  }

  const buckets = new Map<string, { totalDays: number; count: number }>();
  for (const row of rows) {
    if (!row.closed_at) continue;
    const days =
      (new Date(row.closed_at).getTime() - new Date(row.opened_at).getTime()) /
      (24 * 60 * 60 * 1000);
    const band = (row.risk_assessment_id && bandById.get(row.risk_assessment_id)) || 'unknown';
    const b = buckets.get(band) ?? { totalDays: 0, count: 0 };
    b.totalDays += days;
    b.count += 1;
    buckets.set(band, b);
  }
  return [...buckets.entries()].map(([band, b]) => ({
    risk_band: band,
    avg_days: b.count > 0 ? Math.round((b.totalDays / b.count) * 10) / 10 : 0,
    decisions: b.count,
  }));
}

export async function getRiskBandDistribution(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<RiskBandRow[]> {
  const sinceIso = rangeStartIso(monthsBack);
  const { data } = await supabase
    .from('risk_assessments')
    .select('risk_band, assessed_at')
    .eq('tenant_id', tenantId)
    .gte('assessed_at', sinceIso);

  const buckets = new Map<string, number>();
  for (const row of (data ?? []) as { risk_band: string }[]) {
    buckets.set(row.risk_band, (buckets.get(row.risk_band) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([risk_band, count]) => ({ risk_band, count }));
}

/**
 * Aggregates rejected documents by document_type. The schema does not store a
 * structured rejection_reason; granular reasons live in document_events.payload
 * and are out of scope for this aggregate view.
 */
export async function getDocumentRejectionByType(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<DocTypeRow[]> {
  const sinceIso = rangeStartIso(monthsBack);
  const { data } = await supabase
    .from('documents')
    .select('document_type, status, uploaded_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'rejected')
    .gte('uploaded_at', sinceIso);

  const buckets = new Map<string, number>();
  for (const row of (data ?? []) as { document_type: string }[]) {
    buckets.set(row.document_type, (buckets.get(row.document_type) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .map(([document_type, count]) => ({ document_type, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getScreeningHitRate(
  supabase: DB,
  tenantId: string,
  monthsBack: number,
): Promise<ScreeningHitRate> {
  const sinceIso = rangeStartIso(monthsBack);
  const [casesResult, hitsResult] = await Promise.all([
    supabase
      .from('cases')
      .select('id, customer_id, opened_at')
      .eq('tenant_id', tenantId)
      .gte('opened_at', sinceIso),
    supabase
      .from('screening_hits')
      .select('customer_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', sinceIso),
  ]);
  const cases = (casesResult.data ?? []) as { customer_id: string }[];
  const hits = (hitsResult.data ?? []) as { customer_id: string }[];

  const customersWithHits = new Set(hits.map((h) => h.customer_id));
  const casesTotal = cases.length;
  const casesWithHits = cases.filter((c) => customersWithHits.has(c.customer_id)).length;

  return {
    cases_total: casesTotal,
    cases_with_hits: casesWithHits,
    rate: casesTotal > 0 ? casesWithHits / casesTotal : 0,
  };
}
