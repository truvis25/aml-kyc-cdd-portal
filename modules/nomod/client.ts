import type { CreatePaymentLinkRequest, PaymentLinkResponse } from './types';

/**
 * Nomod API Client
 *
 * @todo Fill in actual Nomod API details:
 *   1. Base URL: https://api.nomod.com or similar
 *   2. Authentication: Bearer token? X-API-Key header? HMAC signature?
 *   3. Endpoints: POST /v1/payment-links or similar
 *   4. Webhook signature validation: which header? HMAC-SHA256?
 */

export class NomodClient {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor(apiKey?: string, baseUrl?: string, webhookSecret?: string) {
    this.apiKey = apiKey || process.env.NOMOD_API_KEY || '';
    this.baseUrl = baseUrl || process.env.NOMOD_BASE_URL || 'https://api.nomod.com'; // TODO: verify actual URL
    this.webhookSecret = webhookSecret || process.env.NOMOD_WEBHOOK_SECRET || '';

    if (!this.apiKey) {
      throw new Error('Nomod API key not configured (NOMOD_API_KEY)');
    }
  }

  /**
   * Create a payment link
   * @todo Replace with actual Nomod endpoint once spec is available
   */
  async createPaymentLink(req: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    const path = '/v1/payment-links'; // TODO: verify actual endpoint path

    // TODO: Verify which authentication header Nomod uses (Bearer, X-API-Key, etc.)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`, // TODO: adjust if Nomod uses different auth
    };

    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Nomod createPaymentLink failed: ${response.status} ${error}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Nomod API error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Verify webhook signature
   * @todo Implement once Nomod webhook signature scheme is known
   *   - Which header contains the signature? (X-Nomod-Signature, X-Webhook-Signature, etc.)
   *   - Algorithm? (HMAC-SHA256, HMAC-SHA512)
   *   - Is it signing the body? body + timestamp? Full request?
   */
  verifyWebhookSignature(_body: string, _signature: string, _timestamp?: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Nomod webhook secret not configured; skipping signature verification');
      return true;
    }

    // TODO: implement actual Nomod signature verification
    // Example pattern (adjust based on actual Nomod scheme):
    // const payload = `${body}${timestamp}`;
    // const expected = crypto.createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
    // return expected === signature;

    console.warn('Nomod webhook signature verification not yet implemented');
    return true;
  }

  /**
   * Get payment link status
   * @todo Implement once Nomod API spec is available
   */
  async getPaymentLinkStatus(linkId: string): Promise<PaymentLinkResponse> {
    const path = `/v1/payment-links/${linkId}`; // TODO: verify endpoint path

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Nomod getPaymentLinkStatus failed: ${response.status} ${error}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Nomod API error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

let instance: NomodClient | null = null;

export function getNomodClient(): NomodClient {
  if (!instance) {
    instance = new NomodClient();
  }
  return instance;
}
