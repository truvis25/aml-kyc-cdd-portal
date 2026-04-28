import { createClient } from '@/lib/supabase/server';
import type { NotificationChannel, NotificationTemplate } from './types';
import { log } from '@/lib/logger';

export interface NotificationEventRow {
  tenant_id: string;
  case_id?: string | null;
  customer_id?: string | null;
  channel: NotificationChannel;
  template: NotificationTemplate;
  recipient_hash: string;
  provider: string;
  provider_message_id?: string | null;
  status: 'queued' | 'sent' | 'failed';
  error?: string | null;
}

export async function recordNotificationEvent(row: NotificationEventRow): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('notification_events').insert({
    tenant_id: row.tenant_id,
    case_id: row.case_id ?? null,
    customer_id: row.customer_id ?? null,
    channel: row.channel,
    template: row.template,
    recipient_hash: row.recipient_hash,
    provider: row.provider,
    provider_message_id: row.provider_message_id ?? null,
    status: row.status,
    error: row.error ?? null,
  });
  if (error) {
    // Don't bubble — failing to write the audit row should NOT mask the original
    // intent (the email may have already been sent). Log so ops can investigate.
    log.error('[notifications] failed to insert notification_events row', error);
  }
}
