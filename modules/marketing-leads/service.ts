/**
 * Marketing-leads service.
 *
 * Public surface for prospect capture from the landing site. Not tenant-scoped:
 * leads are pre-sales prospects, not customer data. Audit_log is intentionally
 * NOT touched (audit_log requires tenant_id and is for compliance events).
 *
 * The lead row is the record of truth. Email notification to the sales inbox
 * is best-effort and never blocks the response.
 */

import { createClient } from '@/lib/supabase/server';
import { sendViaResend } from '@/modules/notifications/resend-client';
import { renderLeadNotificationEmail } from '@/modules/notifications/templates/lead-notification';
import type { MarketingLeadInput } from '@/lib/validations/marketingLead';
import { log } from '@/lib/logger';

export interface CreateLeadResult {
  ok: boolean;
  id: string | null;
  error?: 'insert_failed';
}

export async function createLead(input: MarketingLeadInput): Promise<CreateLeadResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketing_leads')
    .insert({
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      role: input.role ?? null,
      vertical: input.vertical ?? null,
      message: input.message ?? null,
      source_path: input.source_path ?? null,
      utm: input.utm ?? {},
    })
    .select('id')
    .single();

  if (error || !data) {
    // Log a stable category, never the raw provider message (CodeQL).
    log.error('[marketing-leads] insert failed', { code: error?.code ?? 'unknown' });
    return { ok: false, id: null, error: 'insert_failed' };
  }

  // Best-effort sales-inbox notification. Never blocks success.
  void notifySalesInbox(input).catch((err) => {
    log.warn('[marketing-leads] sales notification threw', { code: 'notify_threw' });
    void err;
  });

  return { ok: true, id: data.id as string };
}

async function notifySalesInbox(input: MarketingLeadInput): Promise<void> {
  const salesAddress = process.env.MARKETING_LEADS_INBOX;
  if (!salesAddress) {
    // Not configured — no-op (parity with notifications.ts not_configured pattern).
    return;
  }

  const rendered = renderLeadNotificationEmail({
    name: input.name,
    email: input.email,
    company: input.company,
    role: input.role,
    vertical: input.vertical,
    message: input.message,
    sourcePath: input.source_path,
  });

  await sendViaResend({
    to: salesAddress,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}
