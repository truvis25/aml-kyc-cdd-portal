/**
 * Audit log bridge for the TRUVIS DevOs Team agents.
 *
 * Wraps the portal's modules/audit/audit.service.ts so that team agent
 * instructions referencing `lib/audit/log.ts` resolve correctly.
 *
 * The portal's audit_log is append-only and enforced by a Postgres trigger.
 * Always let errors from emit() propagate — the calling operation must roll back.
 */

import { randomUUID } from 'node:crypto'
import { emit } from '@/modules/audit/audit.service'
import type { AuditEventType, AuditEntityType } from '@/lib/constants/events'

export interface AuditContext {
  tenantId: string
  actorId?: string | null
  actorRole?: string | null
  sessionId?: string | null
  ipAddress?: string | null
  requestId?: string | null
  correlationId?: string | null
}

/**
 * Write an audit event. Thin wrapper around modules/audit/audit.service.emit().
 *
 * Prefer withAuditedMutation for the common case (single mutation + audit).
 * Use this directly when you need to audit multiple operations in sequence.
 */
export async function writeAuditLog(
  ctx: AuditContext,
  eventType: AuditEventType,
  entityType: AuditEntityType,
  entityId: string,
  payload?: Record<string, unknown> | null,
): Promise<void> {
  await emit({
    tenant_id: ctx.tenantId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload: payload ?? {},
    actor_id: ctx.actorId ?? null,
    actor_role: ctx.actorRole ?? null,
    session_id: ctx.sessionId ?? null,
    ip_address: ctx.ipAddress ?? null,
  })
}

/**
 * Higher-order wrapper: run a mutation then emit an audit event atomically.
 *
 * Note: Supabase does not expose client-side transaction control. For true
 * atomicity, use a Postgres function (RPC) that performs both the mutation
 * and the audit insert in a single transaction.
 *
 * This wrapper is sufficient for non-critical paths where the audit event
 * can be best-effort (both ops succeed or the error surfaces to the caller).
 *
 * For DATA-risk modules, use Supabase RPC with server-side audit inserts.
 */
export async function withAuditedMutation<T>(
  ctx: AuditContext,
  eventType: AuditEventType,
  entityType: AuditEntityType,
  entityId: string,
  fn: () => Promise<T>,
  buildPayload?: (result: T) => Record<string, unknown>,
): Promise<T> {
  const result = await fn()
  await writeAuditLog(
    ctx,
    eventType,
    entityType,
    entityId,
    buildPayload ? buildPayload(result) : null,
  )
  return result
}

/**
 * Build an AuditContext from an incoming Request and the authenticated user.
 *
 * Generates a correlationId if the request doesn't carry one, so downstream
 * side-effects can be linked to this audit row.
 */
export function auditContextFromRequest(
  request: Request,
  tenantId: string,
  user: { id: string } | null,
  actorRole?: string | null,
): AuditContext {
  return {
    tenantId,
    actorId: user?.id ?? null,
    actorRole: actorRole ?? null,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    requestId: request.headers.get('x-request-id') ?? null,
    correlationId: request.headers.get('x-correlation-id') ?? randomUUID(),
  }
}
