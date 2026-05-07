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
 * Returns per-tenant health metrics for the platform super admin dashboard.
 * Requires the RLS policy to allow platform_super_admin to read all tenants.
 */
export async function getCrossTenantHealth(supabase: DB): Promise<CrossTenantHealthRow[]> {
  const todayIso = startOfTodayIso();

  const { data: tenants } = await supabase.from('tenants').select('id, name').eq('status', 'active');

  if (!tenants || tenants.length === 0) return [];

  const rows = await Promise.all(
    (tenants as { id: string; name: string }[]).map(async (t) => {
      const [openCasesRes, sessionsTodayRes, lastSessionRes, queueDepthRes] = await Promise.all([
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .in('status', ['open', 'in_review', 'pending_info', 'escalated']),
        supabase
          .from('onboarding_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .gte('started_at', todayIso),
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

      const lastActivity =
        (lastSessionRes.data?.[0] as { last_activity_at: string } | undefined)
          ?.last_activity_at ?? null;

      return {
        tenantId: t.id,
        tenantName: t.name,
        openCases: openCasesRes.count ?? 0,
        sessionsToday: sessionsTodayRes.count ?? 0,
        lastActivity,
        queueDepth: queueDepthRes.count ?? 0,
      };
    }),
  );

  return rows;
}

// --- Webhook delivery rate ---

export interface WebhookDeliveryRate {
  successRate: number;
  total: number;
}

/**
 * Returns the webhook delivery success rate for the given tenant over the last
 * `hours` hours (24h or 168h = 7 days).
 */
export async function getWebhookDeliveryRate(
  supabase: DB,
  tenantId: string,
  hours: 24 | 168,
): Promise<WebhookDeliveryRate> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const [totalRes, successRes] = await Promise.all([
    supabase
      .from('webhook_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
    supabase
      .from('webhook_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .eq('status', 'delivered'),
  ]);

  const total = totalRes.count ?? 0;
  const success = successRes.count ?? 0;
  return {
    total,
    successRate: total > 0 ? Math.round((success / total) * 100) : 100,
  };
}

// --- SAR drafts ---

/**
 * Counts SAR reports in 'draft' status for the given tenant.
 * TODO: wire when sar_reports table has RLS enabled for mlro role.
 */
export async function getSarDraftCount(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('sar_reports')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'draft');
  return count ?? 0;
}

// --- Overdue cases ---

/**
 * Counts open/pending cases whose updated_at is older than `thresholdHours`.
 */
export async function getOverdueCasesCount(
  supabase: DB,
  tenantId: string,
  thresholdHours: 48,
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

// --- Analyst avg decision time ---

/**
 * Returns the average hours from case assignment to decision for a given analyst/reviewer.
 * Returns null if no decided cases exist.
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

  if (!data || data.length === 0) return null;

  const rows = data as { assigned_at: string; decided_at: string }[];
  const totalHours = rows.reduce((sum, r) => {
    const diff =
      (new Date(r.decided_at).getTime() - new Date(r.assigned_at).getTime()) /
      (1000 * 60 * 60);
    return sum + diff;
  }, 0);

  return Math.round(totalHours / rows.length);
}

// --- Cases escalated by user ---

export interface EscalatedCaseRow {
  caseId: string;
  status: string;
}

/**
 * Returns the top `limit` cases escalated by the given user, with their current status.
 */
export async function getEscalatedCasesByUser(
  supabase: DB,
  userId: string,
  limit: number = 5,
): Promise<EscalatedCaseRow[]> {
  const { data } = await supabase
    .from('cases')
    .select('id, status')
    .eq('escalated_by', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as { id: string; status: string }[]).map((r) => ({
    caseId: r.id,
    status: r.status,
  }));
}

// --- Pending RAI count ---

/**
 * Counts RAI requests assigned to the given analyst that are in 'sent' status.
 * TODO: wire when rai_requests table exists and has RLS for analyst role.
 */
export async function getPendingRaiCount(supabase: DB, userId: string): Promise<number> {
  const { count } = await supabase
    .from('rai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_analyst', userId)
    .eq('status', 'sent');
  return count ?? 0;
}

// --- Recent document inbox ---

export interface DocumentInboxRow {
  documentId: string;
  caseId: string;
  uploadedAt: string;
}

/**
 * Returns recently uploaded documents on cases assigned to the given analyst.
 * Top `limit` ordered by uploaded_at desc.
 */
export async function getRecentDocumentInbox(
  supabase: DB,
  userId: string,
  limit: number = 5,
): Promise<DocumentInboxRow[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: cases } = await supabase
    .from('cases')
    .select('id, customer_id')
    .eq('assigned_to', userId);

  const customerIds = [
    ...new Set(((cases ?? []) as { id: string; customer_id: string }[]).map((c) => c.customer_id)),
  ];
  if (customerIds.length === 0) return [];

  const caseByCustomer = new Map(
    ((cases ?? []) as { id: string; customer_id: string }[]).map((c) => [c.customer_id, c.id]),
  );

  const { data } = await supabase
    .from('documents')
    .select('id, customer_id, uploaded_at')
    .in('customer_id', customerIds)
    .gte('uploaded_at', since)
    .order('uploaded_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as { id: string; customer_id: string; uploaded_at: string }[]).map((d) => ({
    documentId: d.id,
    caseId: caseByCustomer.get(d.customer_id) ?? '',
    uploadedAt: d.uploaded_at,
  }));
}

// --- Analyst SLA rate ---

/**
 * Returns the percentage (0–100) of closed cases for this analyst that were
 * resolved within 48 hours of assignment.
 */
export async function getAnalystSlaRate(supabase: DB, userId: string): Promise<number> {
  const { data } = await supabase
    .from('cases')
    .select('assigned_at, decided_at')
    .eq('assigned_to', userId)
    .eq('status', 'closed')
    .not('assigned_at', 'is', null)
    .not('decided_at', 'is', null)
    .limit(200);

  if (!data || data.length === 0) return 0;

  const rows = data as { assigned_at: string; decided_at: string }[];
  const withinSla = rows.filter((r) => {
    const hours =
      (new Date(r.decided_at).getTime() - new Date(r.assigned_at).getTime()) /
      (1000 * 60 * 60);
    return hours <= 48;
  }).length;

  return Math.round((withinSla / rows.length) * 100);
}

// --- In-progress sessions for onboarding agent ---

export interface InProgressSessionRow {
  sessionId: string;
  updatedAt: string;
}

/**
 * Returns the top `limit` in-progress onboarding sessions for the tenant,
 * ordered by updated_at desc (most recently active first).
 */
export async function getInProgressSessions(
  supabase: DB,
  tenantId: string,
  limit: number = 5,
): Promise<InProgressSessionRow[]> {
  const { data } = await supabase
    .from('onboarding_sessions')
    .select('id, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as { id: string; updated_at: string }[]).map((r) => ({
    sessionId: r.id,
    updatedAt: r.updated_at,
  }));
}

// --- Pending invitations count ---

/**
 * Counts outstanding (un-accepted) user invitations for the tenant.
 * TODO: wire when user_invitations table exists.
 */
export async function getPendingInvitationsCount(supabase: DB, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from('user_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('accepted_at', null);
  return count ?? 0;
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
