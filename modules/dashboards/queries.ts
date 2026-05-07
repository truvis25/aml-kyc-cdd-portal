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

// --- Daily sparkline series ---

/**
 * Returns a 30-element array (one per day, oldest first) counting onboarding
 * sessions started on each UTC day. Used for sparkline trend widgets.
 */
export async function getDailySessionVolume(
  supabase: DB,
  tenantId: string,
  days: number = 30,
): Promise<number[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('onboarding_sessions')
    .select('started_at')
    .eq('tenant_id', tenantId)
    .gte('started_at', since.toISOString());

  // Build a bucket per day
  const counts = new Array<number>(days).fill(0);
  for (const row of (data ?? []) as { started_at: string }[]) {
    const msAgo = Date.now() - new Date(row.started_at).getTime();
    const dayIdx = days - 1 - Math.floor(msAgo / (24 * 60 * 60 * 1000));
    if (dayIdx >= 0 && dayIdx < days) counts[dayIdx] += 1;
  }
  return counts;
}

/**
 * Returns a `days`-element array counting new cases opened per day (oldest first).
 */
export async function getDailyCaseVolume(
  supabase: DB,
  tenantId: string,
  days: number = 30,
): Promise<number[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('cases')
    .select('opened_at')
    .eq('tenant_id', tenantId)
    .gte('opened_at', since.toISOString());

  const counts = new Array<number>(days).fill(0);
  for (const row of (data ?? []) as { opened_at: string }[]) {
    const msAgo = Date.now() - new Date(row.opened_at).getTime();
    const dayIdx = days - 1 - Math.floor(msAgo / (24 * 60 * 60 * 1000));
    if (dayIdx >= 0 && dayIdx < days) counts[dayIdx] += 1;
  }
  return counts;
}

// --- Cross-tenant health (platform super admin) ---

export interface CrossTenantHealthRow {
  tenantId: string;
  tenantName: string;
  openCases: number;
  sessionsToday: number;
  lastActivity: string | null;
  queueDepth: number;
}

/**
 * Returns per-tenant health metrics for the Platform Super Admin dashboard.
 * Fetches all active tenants then counts open cases, today's sessions,
 * last session activity, and webhook queue depth per tenant.
 */
export async function getCrossTenantHealth(supabase: DB): Promise<CrossTenantHealthRow[]> {
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (!tenants || tenants.length === 0) return [];

  const rows = await Promise.all(
    (tenants as { id: string; name: string }[]).map(async (t) => {
      const todayStart = startOfTodayIso();

      const [openCasesRes, sessionsTodayRes, lastActivityRes, queueDepthRes] = await Promise.all([
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .in('status', ['open', 'in_review', 'pending_info', 'escalated']),
        supabase
          .from('onboarding_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .gte('started_at', todayStart),
        supabase
          .from('onboarding_sessions')
          .select('last_activity_at')
          .eq('tenant_id', t.id)
          .order('last_activity_at', { ascending: false })
          .limit(1),
        supabase
          .from('webhook_events')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .eq('status', 'pending'),
      ]);

      const lastRow = (lastActivityRes.data ?? []) as { last_activity_at: string }[];
      return {
        tenantId: t.id,
        tenantName: t.name,
        openCases: openCasesRes.count ?? 0,
        sessionsToday: sessionsTodayRes.count ?? 0,
        lastActivity: lastRow[0]?.last_activity_at ?? null,
        queueDepth: queueDepthRes.count ?? 0,
      };
    }),
  );

  return rows;
}

/**
 * Returns the webhook delivery success rate for the last `hours` hours.
 * Scoped to a single tenant. Pass tenantId = '' to get platform-wide.
 */
export async function getWebhookDeliveryRate(
  supabase: DB,
  tenantId: string,
  hours: 24 | 168 = 24,
): Promise<{ successRate: number; total: number }> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let totalQ = supabase
    .from('webhook_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (tenantId) totalQ = totalQ.eq('tenant_id', tenantId);

  let successQ = supabase
    .from('webhook_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('status', 'delivered');
  if (tenantId) successQ = successQ.eq('tenant_id', tenantId);

  const [totalRes, successRes] = await Promise.all([totalQ, successQ]);
  const total = totalRes.count ?? 0;
  const success = successRes.count ?? 0;
  return {
    successRate: total > 0 ? Math.round((success / total) * 100) : 100,
    total,
  };
}

// --- SAR / Overdue ---

/**
 * Count SAR reports in 'draft' status for a tenant.
 * TODO: wire when sar_reports table is fully migrated (currently using cases.sar_flagged).
 */
export async function getSarDraftCount(supabase: DB, tenantId: string): Promise<number> {
  // sar_reports table does not yet exist — use cases.sar_flagged as a proxy.
  // TODO: wire when sar_reports table exists (migration 0030+)
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('sar_flagged', true)
    .in('status', ['open', 'in_review', 'pending_info', 'escalated']);
  return count ?? 0;
}

/**
 * Count cases that are open/pending_info and have not been updated within
 * `thresholdHours` hours (i.e. they are considered overdue).
 */
export async function getOverdueCasesCount(
  supabase: DB,
  tenantId: string,
  thresholdHours: number = 48,
): Promise<number> {
  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['open', 'pending_info'])
    .lt('updated_at', cutoff);
  return count ?? 0;
}

// --- Senior Reviewer personal stats ---

/**
 * Average decision time (assigned_at → decided_at) in hours for cases
 * assigned to `userId` that have a decided_at timestamp.
 * Returns null when no decided cases exist.
 */
export async function getAnalystAvgDecisionTime(
  supabase: DB,
  userId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('cases')
    .select('assigned_at, decided_at')
    .eq('assigned_to', userId)
    .not('decided_at', 'is', null)
    .not('assigned_at', 'is', null)
    .limit(100);

  const rows = (data ?? []) as { assigned_at: string; decided_at: string }[];
  if (rows.length === 0) return null;

  const totalMs = rows.reduce((sum, r) => {
    return sum + (new Date(r.decided_at).getTime() - new Date(r.assigned_at).getTime());
  }, 0);
  return Math.round(totalMs / rows.length / (60 * 60 * 1000));
}

/**
 * Top-N cases escalated by the given user (escalated_by field).
 * Returns case_id, status, and a short display label.
 */
export async function getEscalatedCasesByUser(
  supabase: DB,
  userId: string,
  limit: number = 5,
): Promise<{ caseId: string; status: string; openedAt: string }[]> {
  const { data } = await supabase
    .from('cases')
    .select('id, status, opened_at')
    .eq('escalated_by', userId)
    .order('opened_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as { id: string; status: string; opened_at: string }[]).map((r) => ({
    caseId: r.id,
    status: r.status,
    openedAt: r.opened_at,
  }));
}

// --- Analyst personal stats ---

/**
 * Count RAI requests where this analyst is assigned and status is 'sent'
 * (i.e. awaiting a customer response).
 * TODO: wire when rai_requests table exists (migration 0031+)
 */
export async function getPendingRaiCount(supabase: DB, userId: string): Promise<number> {
  // rai_requests table does not yet exist.
  // TODO: wire when rai_requests table exists
  void supabase;
  void userId;
  return 0;
}

/**
 * Recent documents uploaded (within `days` days) on cases assigned to `userId`.
 * Returns top-N rows with document id, case_id, and uploaded_at.
 */
export async function getRecentDocumentInbox(
  supabase: DB,
  userId: string,
  limit: number = 5,
): Promise<{ documentId: string; caseId: string; uploadedAt: string }[]> {
  // Get all case IDs assigned to this user
  const { data: cases } = await supabase
    .from('cases')
    .select('id, customer_id')
    .eq('assigned_to', userId)
    .in('status', ['open', 'in_review', 'pending_info']);

  const customerIds = [
    ...new Set(
      ((cases ?? []) as { id: string; customer_id: string }[]).map((c) => c.customer_id),
    ),
  ];

  if (customerIds.length === 0) return [];

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: docs } = await supabase
    .from('documents')
    .select('id, customer_id, uploaded_at')
    .in('customer_id', customerIds)
    .gte('uploaded_at', since)
    .order('uploaded_at', { ascending: false })
    .limit(limit);

  const casesByCustomer = new Map(
    ((cases ?? []) as { id: string; customer_id: string }[]).map((c) => [c.customer_id, c.id]),
  );

  return ((docs ?? []) as { id: string; customer_id: string; uploaded_at: string }[]).map((d) => ({
    documentId: d.id,
    caseId: casesByCustomer.get(d.customer_id) ?? '',
    uploadedAt: d.uploaded_at,
  }));
}

/**
 * Percentage of this analyst's closed cases that were resolved within 48 hours
 * of being assigned (0–100).
 */
export async function getAnalystSlaRate(supabase: DB, userId: string): Promise<number> {
  const { data } = await supabase
    .from('cases')
    .select('assigned_at, decided_at')
    .eq('assigned_to', userId)
    .eq('status', 'closed')
    .not('decided_at', 'is', null)
    .not('assigned_at', 'is', null)
    .limit(200);

  const rows = (data ?? []) as { assigned_at: string; decided_at: string }[];
  if (rows.length === 0) return 0;

  const slaMs = 48 * 60 * 60 * 1000;
  const withinSla = rows.filter(
    (r) =>
      new Date(r.decided_at).getTime() - new Date(r.assigned_at).getTime() <= slaMs,
  ).length;

  return Math.round((withinSla / rows.length) * 100);
}

// --- Onboarding Agent ---

/**
 * Top-N in-progress onboarding sessions for a tenant, ordered by most-recently
 * active first.
 */
export async function getInProgressSessions(
  supabase: DB,
  tenantId: string,
  limit: number = 5,
): Promise<{ sessionId: string; updatedAt: string }[]> {
  const { data } = await supabase
    .from('onboarding_sessions')
    .select('id, last_activity_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress')
    .order('last_activity_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as { id: string; last_activity_at: string }[]).map((r) => ({
    sessionId: r.id,
    updatedAt: r.last_activity_at,
  }));
}

/**
 * Count outstanding (not-yet-accepted) user invitations for a tenant.
 * TODO: wire when user_invitations table exists
 */
export async function getOutstandingInvitationCount(
  supabase: DB,
  tenantId: string,
): Promise<number> {
  // user_invitations table does not yet exist.
  // TODO: wire when user_invitations table exists
  void supabase;
  void tenantId;
  return 0;
}

// --- Tenant setup completeness ---

/**
 * Per-signal breakdown of tenant onboarding completeness. Each signal is a
 * boolean; the score is the count of `true` signals over the total. Used by
 * the Tenant Admin dashboard to surface what still needs configuring before
 * a tenant goes live.
 */
export interface TenantCompleteness {
  signals: {
    workflowActive: boolean;
    configSet: boolean;
    mlroAssigned: boolean;
    reviewerOrAnalystAssigned: boolean;
  };
  completed: number;
  total: number;
  percent: number;
}

export async function getTenantSetupCompleteness(
  supabase: DB,
  tenantId: string,
): Promise<TenantCompleteness> {
  const [workflow, configRow, mlroCountRes, reviewerCountRes] = await Promise.all([
    getActiveWorkflow(supabase, tenantId),
    supabase
      .from('tenant_config')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    // Active mlro role assignment in this tenant
    supabase
      .from('user_roles')
      .select('id, roles!inner(name)', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('revoked_at', null)
      .eq('roles.name', 'mlro'),
    // At least one analyst or senior_reviewer
    supabase
      .from('user_roles')
      .select('id, roles!inner(name)', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('revoked_at', null)
      .in('roles.name', ['analyst', 'senior_reviewer']),
  ]);

  const signals = {
    workflowActive: !!workflow,
    configSet: (configRow.count ?? 0) > 0,
    mlroAssigned: (mlroCountRes.count ?? 0) > 0,
    reviewerOrAnalystAssigned: (reviewerCountRes.count ?? 0) > 0,
  };
  const completed = Object.values(signals).filter(Boolean).length;
  const total = Object.keys(signals).length;
  return { signals, completed, total, percent: Math.round((completed / total) * 100) };
}
