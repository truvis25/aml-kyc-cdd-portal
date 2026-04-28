import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type DB = SupabaseClient<Database>;

// --- Time helpers ---

/**
 * Returns an ISO string for a moment `daysBack` days before now. Centralised so
 * that components don't call `Date.now()` directly inside their render bodies
 * (the react-hooks/purity rule flags such calls).
 */
export function daysAgoIso(daysBack: number): string {
  return new Date(new Date().getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();
}

/** ISO string for the start of the current UTC day. */
export function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// --- Cases ---

export async function countCasesByStatus(
  supabase: DB,
  tenantId: string,
  statuses: string[],
): Promise<number> {
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', statuses);
  return count ?? 0;
}

export async function countOpenCases(supabase: DB, tenantId: string): Promise<number> {
  return countCasesByStatus(supabase, tenantId, [
    'open',
    'in_review',
    'pending_info',
    'escalated',
  ]);
}

export async function countUnassignedOpenCases(
  supabase: DB,
  tenantId: string,
): Promise<number> {
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['open', 'in_review'])
    .is('assigned_to', null);
  return count ?? 0;
}

export async function countCasesAssignedTo(
  supabase: DB,
  userId: string,
  opts: { openOnly?: boolean } = {},
): Promise<number> {
  let q = supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', userId);
  if (opts.openOnly) q = q.in('status', ['open', 'in_review', 'pending_info']);
  const { count } = await q;
  return count ?? 0;
}

export async function countCasesAssignedToWithStatus(
  supabase: DB,
  userId: string,
  statuses: string[],
): Promise<number> {
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .in('status', statuses);
  return count ?? 0;
}

export async function countSarFlagged(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('sar_flagged', true)
    .neq('status', 'closed');
  return count ?? 0;
}

export async function countCasesByQueue(
  supabase: DB,
  tenantId: string,
  queues: string[],
): Promise<number> {
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('queue', queues)
    .neq('status', 'closed');
  return count ?? 0;
}

/**
 * Counts open cases whose linked risk assessment falls in the given bands.
 * Used for high-risk widgets on the MLRO dashboard.
 */
export async function countOpenCasesByRiskBand(
  supabase: DB,
  tenantId: string,
  bands: string[],
): Promise<number> {
  const { data: riskRows } = await supabase
    .from('risk_assessments')
    .select('id')
    .eq('tenant_id', tenantId)
    .in('risk_band', bands);
  const riskIds = (riskRows ?? []).map((r) => (r as { id: string }).id);
  if (riskIds.length === 0) return 0;

  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('risk_assessment_id', riskIds)
    .neq('status', 'closed');
  return count ?? 0;
}

// --- Sessions ---

export async function countActiveSessions(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('onboarding_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress');
  return count ?? 0;
}

export async function countSessionsSince(
  supabase: DB,
  tenantId: string,
  sinceIso: string,
): Promise<number> {
  const { count } = await supabase
    .from('onboarding_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('started_at', sinceIso);
  return count ?? 0;
}

export async function countStuckSessions(
  supabase: DB,
  tenantId: string,
  hoursOld: number,
): Promise<number> {
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('onboarding_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'paused')
    .lt('last_activity_at', cutoff);
  return count ?? 0;
}

// --- Documents ---

export async function countPendingDocs(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'uploaded');
  return count ?? 0;
}

export async function countPendingDocsForUser(
  supabase: DB,
  userId: string,
): Promise<number> {
  const { data: cases } = await supabase
    .from('cases')
    .select('customer_id')
    .eq('assigned_to', userId);
  const customerIds = [
    ...new Set((cases ?? []).map((c) => (c as { customer_id: string }).customer_id)),
  ];
  if (customerIds.length === 0) return 0;
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .in('customer_id', customerIds)
    .eq('status', 'uploaded');
  return count ?? 0;
}

// --- Screening hits ---

export async function countUnresolvedHits(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('screening_hits')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending');
  return count ?? 0;
}

export async function countUnresolvedHitsForUser(
  supabase: DB,
  userId: string,
): Promise<number> {
  const { data: cases } = await supabase
    .from('cases')
    .select('customer_id')
    .eq('assigned_to', userId);
  const customerIds = [
    ...new Set((cases ?? []).map((c) => (c as { customer_id: string }).customer_id)),
  ];
  if (customerIds.length === 0) return 0;
  const { count } = await supabase
    .from('screening_hits')
    .select('id', { count: 'exact', head: true })
    .in('customer_id', customerIds)
    .eq('status', 'pending');
  return count ?? 0;
}

// --- Lifecycle helpers ---

export async function getOldestOpenInQueue(
  supabase: DB,
  tenantId: string,
  queues: string[],
): Promise<string | null> {
  const { data } = await supabase
    .from('cases')
    .select('opened_at')
    .eq('tenant_id', tenantId)
    .in('queue', queues)
    .neq('status', 'closed')
    .order('opened_at', { ascending: true })
    .limit(1);
  return (data?.[0] as { opened_at: string } | undefined)?.opened_at ?? null;
}

export async function getRecentDecisionsByUser(
  supabase: DB,
  userId: string,
  limit: number,
): Promise<{ case_id: string; decision: string; decided_at: string }[]> {
  const { data } = await supabase
    .from('approvals')
    .select('case_id, decision, decided_at')
    .eq('decided_by', userId)
    .order('decided_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as { case_id: string; decision: string; decided_at: string }[];
}

export async function countOverdueAssignedCases(
  supabase: DB,
  userId: string,
  businessDays: number,
): Promise<number> {
  const cutoff = new Date(Date.now() - businessDays * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .in('status', ['open', 'in_review', 'pending_info'])
    .lt('opened_at', cutoff);
  return count ?? 0;
}

// --- Tenant context ---

export async function getTenantSlug(supabase: DB, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .single();
  return (data as { slug?: string } | null)?.slug ?? null;
}

export async function getActiveWorkflow(
  supabase: DB,
  tenantId: string,
): Promise<{ name: string; version: number; created_at: string } | null> {
  const { data } = await supabase
    .from('workflow_definitions')
    .select('name, version, created_at')
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1);
  return (
    (data?.[0] as { name: string; version: number; created_at: string } | undefined) ?? null
  );
}

export async function countActiveUsersInTenant(
  supabase: DB,
  tenantId: string,
): Promise<number> {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');
  return count ?? 0;
}
