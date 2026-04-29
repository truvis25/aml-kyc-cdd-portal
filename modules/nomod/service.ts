import { getNomodClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import type { CreatePaymentLinkRequest } from './types';

/**
 * Create a payment link for trial subscription
 */
export async function createTrialPaymentLink(input: {
  tenantId: string;
  companyName: string;
  email: string;
  plan: 'starter' | 'growth'; // enterprise is custom quote, no link
  amountAED: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ linkId: string; linkUrl: string }> {
  const nomod = getNomodClient();
  const db = await createClient();

  try {
    // Create payment link via Nomod
    const linkReq: CreatePaymentLinkRequest = {
      amount: Math.round(input.amountAED * 100), // Convert to fils (smallest unit)
      currency: 'AED',
      description: `TruVis ${input.plan} plan - 14 day trial`,
      customer_email: input.email,
      customer_name: input.companyName,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        tenant_id: input.tenantId,
        plan: input.plan,
        type: 'trial_subscription',
      },
    };

    const link = await nomod.createPaymentLink(linkReq);

    // Store payment link reference
    const { error } = await db
      .from('tenant_billing_links')
      .insert({
        tenant_id: input.tenantId,
        nomod_link_id: link.id,
        nomod_link_url: link.link_url,
        plan: input.plan,
        amount_aed: input.amountAED,
        status: 'created',
      });

    if (error) throw error;

    // Emit audit event
    await emit({
      tenant_id: input.tenantId,
      event_type: AuditEventType.WEBHOOK_RECEIVED, // Generic event; TODO: add billing.link.created event type if needed
      entity_type: AuditEntityType.TENANT,
      entity_id: input.tenantId,
      payload: {
        action: 'payment_link_created',
        linkId: link.id,
        plan: input.plan,
      },
    });

    return {
      linkId: link.id,
      linkUrl: link.link_url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await emit({
      tenant_id: input.tenantId,
      event_type: AuditEventType.WEBHOOK_FAILED,
      entity_type: AuditEntityType.TENANT,
      entity_id: input.tenantId,
      payload: {
        action: 'payment_link_creation_failed',
        error: message,
      },
    });

    throw error;
  }
}

/**
 * Handle payment webhook from Nomod
 * @todo Implement once actual webhook event structure is known
 */
export async function handlePaymentWebhook(input: {
  eventType: string; // 'payment.completed', 'payment.failed', etc.
  linkId: string;
  tenantId: string;
  amount: number;
  status: string;
  paymentId: string;
}): Promise<{ success: boolean }> {
  const db = await createClient();

  try {
    if (input.eventType === 'payment.completed') {
      // Mark payment as complete
      const { error: updateError } = await db
        .from('tenant_billing_links')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          nomod_payment_id: input.paymentId,
        })
        .eq('nomod_link_id', input.linkId);

      if (updateError) throw updateError;

      // Update tenant billing status to 'active' (trial completed, subscription started)
      const { error: billingError } = await db
        .from('tenant_billing')
        .update({
          status: 'active',
          billing_period_start: new Date().toISOString(),
          // TODO: Set billing_period_end based on subscription duration
        })
        .eq('tenant_id', input.tenantId);

      if (billingError) throw billingError;

      // Emit audit event
      await emit({
        tenant_id: input.tenantId,
        event_type: AuditEventType.WEBHOOK_PROCESSED,
        entity_type: AuditEntityType.TENANT,
        entity_id: input.tenantId,
        payload: {
          action: 'payment_received',
          linkId: input.linkId,
          amount: input.amount,
          paymentId: input.paymentId,
        },
      });

      return { success: true };
    }

    if (input.eventType === 'payment.failed') {
      // Mark payment as failed
      const { error } = await db
        .from('tenant_billing_links')
        .update({
          status: 'failed',
        })
        .eq('nomod_link_id', input.linkId);

      if (error) throw error;

      // Emit audit event
      await emit({
        tenant_id: input.tenantId,
        event_type: AuditEventType.WEBHOOK_FAILED,
        entity_type: AuditEntityType.TENANT,
        entity_id: input.tenantId,
        payload: {
          action: 'payment_failed',
          linkId: input.linkId,
          paymentId: input.paymentId,
        },
      });

      return { success: true };
    }

    // Unknown event type - log but don't error
    console.log(`Unhandled Nomod event type: ${input.eventType}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await emit({
      tenant_id: input.tenantId,
      event_type: AuditEventType.WEBHOOK_FAILED,
      entity_type: AuditEntityType.TENANT,
      entity_id: input.tenantId,
      payload: {
        action: 'webhook_processing_failed',
        error: message,
      },
    });

    throw error;
  }
}

/**
 * Get payment link status
 */
export async function getPaymentLinkStatus(linkId: string): Promise<string> {
  const nomod = getNomodClient();

  try {
    const link = await nomod.getPaymentLinkStatus(linkId);
    return link.status;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to get payment link status: ${message}`);
    throw error;
  }
}
