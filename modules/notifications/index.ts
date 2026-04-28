/**
 * Public surface for outbound notifications.
 *
 * Each entry point:
 *  1. Looks up tenant + customer context from the DB (RLS scoped).
 *  2. Renders the template.
 *  3. Sends via Resend (no-op in not_configured environments).
 *  4. Records the result in `notification_events` for audit / retry visibility.
 *  5. Emits an audit_log event so the master log shows the send.
 *
 * NEVER throws: send failures are recorded in `notification_events` with
 * status='failed'. Callers should not rely on email delivery for correctness;
 * the corresponding case_event / approval row is the source of truth.
 */
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { sendViaResend } from './resend-client';
import { recordNotificationEvent } from './notifications.repository';
import { renderRaiEmail } from './templates/rai';
import { renderApprovalEmail } from './templates/approval';
import { renderRejectionEmail } from './templates/rejection';
import type { SendResult } from './types';

interface RaiInput {
  tenantId: string;
  caseId: string;
  customerId: string;
  infoRequested: string;
  documentsRequired?: string[];
  actorId: string;
  actorRole: string;
}

interface DecisionInput {
  tenantId: string;
  caseId: string;
  customerId: string;
  actorId: string;
  actorRole: string;
}

interface CustomerContact {
  email: string;
  fullName: string;
}

interface TenantContext {
  name: string;
  slug: string;
}

async function loadCustomerContact(
  tenantId: string,
  customerId: string,
): Promise<CustomerContact | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('customer_data_versions')
    .select('email, full_name, version')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('version', { ascending: false })
    .limit(1);

  const row = (data?.[0] as { email: string | null; full_name: string | null } | undefined) ?? null;
  if (!row?.email) return null;
  return { email: row.email, fullName: row.full_name?.trim() || 'Customer' };
}

async function loadTenant(tenantId: string): Promise<TenantContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .single();
  return (data as TenantContext | null) ?? null;
}

async function loadSessionIdForCase(
  tenantId: string,
  caseId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cases')
    .select('session_id')
    .eq('id', caseId)
    .eq('tenant_id', tenantId)
    .single();
  return (data as { session_id: string | null } | null)?.session_id ?? null;
}

function buildStatusUrl(slug: string, sessionId: string | null): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!sessionId) return `${base}/${slug}/status`;
  return `${base}/${slug}/status/${sessionId}`;
}

function hashRecipient(addr: string): string {
  return createHash('sha256').update(addr.trim().toLowerCase()).digest('hex');
}

async function commonSend({
  tenantId,
  caseId,
  customerId,
  template,
  subject,
  text,
  html,
  to,
  actorId,
  actorRole,
  auditEventType,
  idempotencyKey,
}: {
  tenantId: string;
  caseId: string;
  customerId: string;
  template: 'rai' | 'approval' | 'rejection';
  subject: string;
  text: string;
  html: string;
  to: string;
  actorId: string;
  actorRole: string;
  auditEventType: AuditEventType;
  idempotencyKey: string;
}): Promise<SendResult> {
  const recipientHash = hashRecipient(to);

  const sendResult = await sendViaResend({ to, subject, text, html, idempotencyKey });

  await recordNotificationEvent({
    tenant_id: tenantId,
    case_id: caseId,
    customer_id: customerId,
    channel: 'email',
    template,
    recipient_hash: recipientHash,
    provider: 'resend',
    provider_message_id: sendResult.providerMessageId,
    status: sendResult.ok ? 'sent' : 'failed',
    error: sendResult.error ?? null,
  });

  // Best-effort audit emission. We DO want this to throw if it fails (per
  // audit-write-failure rule), so we do it last and let the caller catch.
  try {
    await audit.emit({
      tenant_id: tenantId,
      event_type: auditEventType,
      entity_type: AuditEntityType.CASE,
      entity_id: caseId,
      actor_id: actorId,
      actor_role: actorRole,
      payload: { template, status: sendResult.ok ? 'sent' : 'failed', provider: 'resend' },
    });
  } catch (err) {
    // Notification audit failure should not mask the email-send result.
    // Log and continue; the notification_events row is still the canonical
    // record of what happened.
    console.error('[notifications] audit emit failed:', err);
  }

  return {
    ok: sendResult.ok,
    providerMessageId: sendResult.providerMessageId,
    error: sendResult.error,
  };
}

export async function sendRaiEmail(input: RaiInput): Promise<SendResult> {
  const [tenant, contact, sessionId] = await Promise.all([
    loadTenant(input.tenantId),
    loadCustomerContact(input.tenantId, input.customerId),
    loadSessionIdForCase(input.tenantId, input.caseId),
  ]);

  if (!tenant || !contact) {
    await recordNotificationEvent({
      tenant_id: input.tenantId,
      case_id: input.caseId,
      customer_id: input.customerId,
      channel: 'email',
      template: 'rai',
      recipient_hash: 'unknown',
      provider: 'resend',
      status: 'failed',
      error: !contact ? 'no_customer_email' : 'no_tenant',
    });
    return { ok: false, providerMessageId: null, error: !contact ? 'no_customer_email' : 'no_tenant' };
  }

  const rendered = renderRaiEmail({
    tenantName: tenant.name,
    customerName: contact.fullName,
    infoRequested: input.infoRequested,
    documentsRequired: input.documentsRequired,
    statusUrl: buildStatusUrl(tenant.slug, sessionId),
  });

  return commonSend({
    tenantId: input.tenantId,
    caseId: input.caseId,
    customerId: input.customerId,
    template: 'rai',
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    to: contact.email,
    actorId: input.actorId,
    actorRole: input.actorRole,
    auditEventType: AuditEventType.CASE_RAI_SENT,
    // Same case + actor + day shouldn't double-send if a UI user double-clicks.
    idempotencyKey: `rai:${input.caseId}:${input.actorId}:${new Date().toISOString().slice(0, 10)}`,
  });
}

export async function sendApprovalEmail(input: DecisionInput): Promise<SendResult> {
  const [tenant, contact, sessionId] = await Promise.all([
    loadTenant(input.tenantId),
    loadCustomerContact(input.tenantId, input.customerId),
    loadSessionIdForCase(input.tenantId, input.caseId),
  ]);
  if (!tenant || !contact) {
    await recordNotificationEvent({
      tenant_id: input.tenantId,
      case_id: input.caseId,
      customer_id: input.customerId,
      channel: 'email',
      template: 'approval',
      recipient_hash: 'unknown',
      provider: 'resend',
      status: 'failed',
      error: !contact ? 'no_customer_email' : 'no_tenant',
    });
    return { ok: false, providerMessageId: null, error: !contact ? 'no_customer_email' : 'no_tenant' };
  }

  const rendered = renderApprovalEmail({
    tenantName: tenant.name,
    customerName: contact.fullName,
    statusUrl: buildStatusUrl(tenant.slug, sessionId),
  });

  return commonSend({
    tenantId: input.tenantId,
    caseId: input.caseId,
    customerId: input.customerId,
    template: 'approval',
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    to: contact.email,
    actorId: input.actorId,
    actorRole: input.actorRole,
    auditEventType: AuditEventType.APPROVAL_GRANTED,
    idempotencyKey: `approval:${input.caseId}`,
  });
}

export async function sendRejectionEmail(input: DecisionInput): Promise<SendResult> {
  const [tenant, contact, sessionId] = await Promise.all([
    loadTenant(input.tenantId),
    loadCustomerContact(input.tenantId, input.customerId),
    loadSessionIdForCase(input.tenantId, input.caseId),
  ]);
  if (!tenant || !contact) {
    await recordNotificationEvent({
      tenant_id: input.tenantId,
      case_id: input.caseId,
      customer_id: input.customerId,
      channel: 'email',
      template: 'rejection',
      recipient_hash: 'unknown',
      provider: 'resend',
      status: 'failed',
      error: !contact ? 'no_customer_email' : 'no_tenant',
    });
    return { ok: false, providerMessageId: null, error: !contact ? 'no_customer_email' : 'no_tenant' };
  }

  const rendered = renderRejectionEmail({
    tenantName: tenant.name,
    customerName: contact.fullName,
    statusUrl: buildStatusUrl(tenant.slug, sessionId),
  });

  return commonSend({
    tenantId: input.tenantId,
    caseId: input.caseId,
    customerId: input.customerId,
    template: 'rejection',
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    to: contact.email,
    actorId: input.actorId,
    actorRole: input.actorRole,
    auditEventType: AuditEventType.APPROVAL_REJECTED,
    idempotencyKey: `rejection:${input.caseId}`,
  });
}
