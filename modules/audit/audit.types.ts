import type { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import type { Json } from '@/lib/supabase/database.types';

/**
 * Payload for emitting an audit event.
 * Source of truth: PRD v1.0 Section 4.4 — Audit Trail Data Design
 */
export interface AuditEventPayload {
  tenant_id: string;
  event_type: AuditEventType;
  entity_type: AuditEntityType;
  entity_id: string;
  payload?: Json;
  // Actor context — null for system events
  actor_id?: string | null;
  actor_role?: string | null;
  session_id?: string | null;
  // IP address masked to /24 (last octet zeroed) before storage
  ip_address?: string | null;
}

/**
 * An audit log record as stored in the database.
 * row_hash and prev_hash are computed by the database.
 */
export interface AuditEvent extends AuditEventPayload {
  id: string;
  event_time: string;
  prev_hash: string | null;
  row_hash: string | null;
}

/**
 * Query filters for reading audit log events.
 */
export interface AuditQueryFilters {
  tenant_id: string;
  entity_type?: AuditEntityType;
  entity_id?: string;
  event_type?: AuditEventType;
  actor_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * A single audit log export record (JSON-L line)
 */
export interface AuditExportRecord {
  id: string;
  event_time: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string;
  payload: Json;
  row_hash: string | null;
}
