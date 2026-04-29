import { z } from 'zod';

// TODO: Fill in these schemas once Nomod API spec is available
// See: https://nomod.com/docs/api-reference/introduction

/**
 * Request to create a payment link
 * @todo Verify actual Nomod request body fields (amount, currency, description, metadata, etc.)
 */
export const CreatePaymentLinkRequestSchema = z.object({
  amount: z.number().positive(), // in smallest currency unit (e.g., fils for AED)
  currency: z.string().default('AED'), // Nomod supports AED, SAR
  description: z.string(),
  customer_email: z.string().email(),
  customer_name: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Callback URLs
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export type CreatePaymentLinkRequest = z.infer<typeof CreatePaymentLinkRequestSchema>;

/**
 * Response from create payment link
 * @todo Verify actual Nomod response fields (id, link_url, expires_at, status, etc.)
 */
export const PaymentLinkResponseSchema = z.object({
  id: z.string(),
  link_url: z.string().url(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['active', 'expired', 'paid', 'cancelled']),
  expires_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PaymentLinkResponse = z.infer<typeof PaymentLinkResponseSchema>;

/**
 * Webhook event from Nomod (e.g., payment received)
 * @todo Verify actual Nomod webhook payload structure and event types
 */
export const PaymentWebhookSchema = z.object({
  event_type: z.enum(['payment.completed', 'payment.failed', 'link.expired']),
  payment_id: z.string(),
  link_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(), // 'success', 'failed', etc.
  timestamp: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>;
