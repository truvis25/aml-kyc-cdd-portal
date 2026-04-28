/**
 * Thin Resend SDK wrapper. Single entry point so that callers don't import
 * the SDK directly and so that testing or provider swaps are localised here.
 *
 * Configuration via env vars (see .env.example):
 *   RESEND_API_KEY        — API key from resend.com/api-keys
 *   RESEND_FROM_ADDRESS   — verified sender, e.g. compliance@truvis.ae
 *   RESEND_REPLY_TO       — optional reply-to address
 *
 * Behaviour when RESEND_API_KEY is unset: the function returns a "queued"
 * result with ok=false and error='not_configured' instead of throwing. This
 * lets non-prod environments run without a key while still recording the
 * intent in notification_events.
 */
import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Idempotency key — Resend dedupes retries with this header. */
  idempotencyKey?: string;
}

export interface ResendResponse {
  ok: boolean;
  providerMessageId: string | null;
  error?: string;
}

export async function sendViaResend(args: SendArgs): Promise<ResendResponse> {
  const resend = getClient();
  const from = process.env.RESEND_FROM_ADDRESS;
  if (!resend || !from) {
    return { ok: false, providerMessageId: null, error: 'not_configured' };
  }

  const replyTo = process.env.RESEND_REPLY_TO || undefined;

  try {
    const result = await resend.emails.send(
      {
        from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
        replyTo,
      },
      args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined,
    );

    if (result.error) {
      return {
        ok: false,
        providerMessageId: null,
        // Resend errors carry a `name` like 'validation_error' or 'rate_limit_exceeded'.
        // Use that as a stable category; never echo raw .message back to callers
        // (CodeQL information-exposure pattern).
        error: result.error.name ?? 'send_failed',
      };
    }

    return { ok: true, providerMessageId: result.data?.id ?? null };
  } catch {
    // Don't include the exception message — Resend SDK errors can include
    // request/response bodies. Log via console.error for ops debugging.
    console.error('[notifications] sendViaResend threw');
    return { ok: false, providerMessageId: null, error: 'send_threw' };
  }
}
