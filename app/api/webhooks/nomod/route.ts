import { NextRequest, NextResponse } from 'next/server';
import { getNomodClient } from '@/modules/nomod/client';
import { handlePaymentWebhook } from '@/modules/nomod';
import { PaymentWebhookSchema } from '@/modules/nomod/types';

/**
 * Webhook handler for Nomod payment events
 * POST /api/webhooks/nomod
 *
 * @todo Verify actual Nomod webhook signature header name and location
 *   - Is it in X-Nomod-Signature header?
 *   - Is there a timestamp in X-Nomod-Timestamp?
 *   - How should signature be validated?
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual signature header name from Nomod docs
    const signature = req.headers.get('x-nomod-signature');
    const timestamp = req.headers.get('x-nomod-timestamp');

    if (!signature) {
      console.warn('Nomod webhook missing signature header');
      // For now, continue without signature verification (update when spec is known)
      // In production, return 401 if signature is missing
    }

    // Read and parse body
    const body = await req.text();

    try {
      const payload = JSON.parse(body);

      // Verify signature if available
      if (signature && timestamp) {
        const nomod = getNomodClient();
        const isValid = nomod.verifyWebhookSignature(body, signature, timestamp);

        if (!isValid) {
          console.error('Nomod webhook signature verification failed');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      }

      // Parse and validate webhook schema
      const event = PaymentWebhookSchema.parse(payload);

      // Extract tenant ID from metadata
      // TODO: Adjust based on how Nomod includes tenant_id in webhook (metadata, custom field, etc.)
      const tenantId = payload.metadata?.tenant_id;

      if (!tenantId) {
        console.warn('Nomod webhook missing tenant_id in metadata');
        return NextResponse.json(
          { message: 'Event processed (tenant_id not found)' },
          { status: 200 }
        );
      }

      // Handle the payment event
      await handlePaymentWebhook({
        eventType: event.event_type,
        linkId: event.link_id,
        tenantId,
        amount: event.amount,
        status: event.status,
        paymentId: event.payment_id,
      });

      return NextResponse.json(
        { message: 'Webhook processed successfully' },
        { status: 200 }
      );
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Parse error';
      console.error(`Nomod webhook parse error: ${message}`);

      // Return 400 for malformed payloads (don't retry)
      return NextResponse.json(
        { error: message },
        { status: 200 } // Return 200 to prevent Nomod retries on malformed data
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Nomod webhook error: ${message}`);

    // Return 500 for transient errors (Nomod will retry)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
