/**
 * Audit Service — the single interface for writing and reading audit events.
 *
 * Compliance requirement (DevPlan Section 8.4):
 * - Every data mutation MUST emit an audit event.
 * - If the audit write fails within a transaction, the entire transaction MUST roll back.
 * - No silent audit failures.
 * - Never query audit_log without a tenant_id filter.
 *
 * Source of truth: PRD v1.0 Section 4.4, DevPlan v1.0 Section 8.4
 */

import { createClient } from '@/lib/supabase/server';
import type { AuditEventPayload, AuditEvent, AuditQueryFilters, AuditExportRecord } from './audit.types';

/**
 * Emit an audit event. This is the primary write path for all compliance events.
 *
 * Throws if the audit write fails — this ensures the calling transaction rolls back.
 * Never suppress the error from this function.
 */
export async function emit(payload: AuditEventPayload): Promise<void> {
  const supabase = await createClient();

  // Mask IP address to /24 (zero the last octet) for privacy
  const maskedIp = payload.ip_address ? maskIpAddress(payload.ip_address) : null;

  const { error } = await supabase.from('audit_log').insert({
    tenant_id: payload.tenant_id,
    event_type: payload.event_type,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    payload: payload.payload ?? {},
    actor_id: payload.actor_id ?? null,
    actor_role: payload.actor_role ?? null,
    session_id: payload.session_id ?? null,
    ip_address: maskedIp,
  });

  if (error) {
    // Audit write failure is a blocking error — do NOT swallow it.
    // The caller must handle this, usually by rolling back any transaction.
    throw new AuditWriteError(error.message, payload.event_type);
  }
}

/**
 * Query audit log events for a specific tenant.
 * The tenant_id filter is always applied — never returns cross-tenant data.
 */
export async function query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('audit_log')
    .select('*')
    .eq('tenant_id', filters.tenant_id) // Always filter by tenant — never skip this
    .order('event_time', { ascending: false });

  if (filters.entity_type) {
    queryBuilder = queryBuilder.eq('entity_type', filters.entity_type);
  }
  if (filters.entity_id) {
    queryBuilder = queryBuilder.eq('entity_id', filters.entity_id);
  }
  if (filters.event_type) {
    queryBuilder = queryBuilder.eq('event_type', filters.event_type);
  }
  if (filters.actor_id) {
    queryBuilder = queryBuilder.eq('actor_id', filters.actor_id);
  }
  if (filters.from_date) {
    queryBuilder = queryBuilder.gte('event_time', filters.from_date);
  }
  if (filters.to_date) {
    queryBuilder = queryBuilder.lte('event_time', filters.to_date);
  }
  if (filters.limit) {
    queryBuilder = queryBuilder.limit(filters.limit);
  }
  if (filters.offset) {
    queryBuilder = queryBuilder.range(
      filters.offset,
      filters.offset + (filters.limit ?? 50) - 1
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Audit query failed: ${error.message}`);
  }

  return (data ?? []) as AuditEvent[];
}

/**
 * Export audit log events as JSON-L (JSON Lines) for regulatory reporting.
 * Returns each event as a separate JSON object on its own line.
 */
export async function exportAsJsonL(filters: AuditQueryFilters): Promise<string> {
  const events = await query(filters);

  const records: AuditExportRecord[] = events.map((event) => ({
    id: event.id,
    event_time: event.event_time,
    event_type: event.event_type,
    actor_id: event.actor_id ?? null,
    actor_role: event.actor_role ?? null,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    payload: event.payload ?? {},
    row_hash: event.row_hash ?? null,
  }));

  return records.map((r) => JSON.stringify(r)).join('\n');
}

/**
 * Mask an IP address to /24 by zeroing the last octet.
 * E.g., 192.168.1.100 → 192.168.1.0
 * Satisfies PRD privacy requirement for audit_log.ip_address
 */
function maskIpAddress(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    // IPv4
    parts[3] = '0';
    return parts.join('.');
  }
  // IPv6: mask last 16 bits
  return ip.replace(/:[0-9a-fA-F]*$/, ':0');
}

export class AuditWriteError extends Error {
  readonly eventType: string;

  constructor(message: string, eventType: string) {
    super(`Audit write failed for event '${eventType}': ${message}`);
    this.name = 'AuditWriteError';
    this.eventType = eventType;
  }
}
