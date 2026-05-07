import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getSumsubClient } from '@/modules/sumsub/client';
import { handleApplicantReviewedWebhook } from '@/modules/sumsub';
import { ApplicantReviewedWebhookSchema } from '@/modules/sumsub/types';

/**
 * Webhook handler for Sumsub applicantReviewed events
 * POST /api/webhooks/sumsub
 *
 * Headers:
 *   X-App-Access-Ts: timestamp (seconds since epoch)
 *   X-App-Access-Token: HMAC-SHA256(body + timestamp, secretKey)
 */
export async function POST(req: NextRequest) {
  try {
    // Get signature headers
    const signature = req.headers.get('x-app-access-token');
    const timestamp = req.headers.get('x-app-access-ts');

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 401 }
      );
    }

    // Read body
    const body = await req.text();

    // Verify signature
    const sumsub = getSumsubClient();
    const isValid = sumsub.verifyWebhookSignature(body, signature, timestamp);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);
    const event = ApplicantReviewedWebhookSchema.parse(payload);

    // Handle only applicantReviewed events
    if (event.eventType !== 'applicantReviewed') {
      return NextResponse.json(
        { message: 'Event ignored (not applicantReviewed)' },
        { status: 200 }
      );
    }

    // Process webhook
    await handleApplicantReviewedWebhook({
      sumsubApplicantId: event.applicantId,
      externalUserId: event.externalUserId || '',
      reviewResult: event.reviewResult,
    });

    return NextResponse.json(
      { message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log error internally; do not reflect SDK error messages to the caller.
    log.error('IDV webhook error', error, { code: 'idv_webhook_failed' });

    // Return 200 for signature/parsing errors (don't retry)
    // Return 500 for transient errors (provider will retry)
    if (message.includes('signature') || message.includes('parse')) {
      return NextResponse.json({ error: 'Webhook signature or payload error' }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Webhook processing failed. Retry later.' },
      { status: 500 }
    );
  }
}
