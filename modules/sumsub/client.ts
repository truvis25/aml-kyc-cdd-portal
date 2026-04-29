import crypto from 'crypto';
import { CreateApplicantRequest, CreateApplicantResponse, ApplicantStatusResponse, AccessTokenResponse } from './types';

export class SumsubClient {
  private appId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(appId?: string, secretKey?: string, sandbox: boolean = true) {
    this.appId = appId || process.env.SUMSUB_APP_ID || '';
    this.secretKey = secretKey || process.env.SUMSUB_SECRET_KEY || '';
    this.baseUrl = sandbox
      ? 'https://api.sumsub.com'
      : 'https://api.sumsub.com'; // Both use same endpoint; sandbox flag is in credentials

    if (!this.appId || !this.secretKey) {
      throw new Error('Sumsub credentials not configured (SUMSUB_APP_ID, SUMSUB_SECRET_KEY)');
    }
  }

  /**
   * Sign request with HMAC-SHA256
   * Signature = HMAC-SHA256(method + path + body + timestamp, secretKey)
   */
  private sign(method: string, path: string, body?: string, timestamp?: number): { signature: string; ts: number } {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const payload = `${method}${path}${body || ''}${ts}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
    return { signature, ts };
  }

  /**
   * Verify webhook signature
   * Signature = HMAC-SHA256(body + timestamp, secretKey)
   */
  verifyWebhookSignature(body: string, signature: string, timestamp: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${body}${timestamp}`)
      .digest('hex');
    return expected === signature;
  }

  /**
   * Create an applicant
   */
  async createApplicant(req: CreateApplicantRequest): Promise<CreateApplicantResponse> {
    const path = '/resources/applicants';
    const body = JSON.stringify(req);
    const { signature, ts } = this.sign('POST', path, body);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': this.appId,
        'X-App-Access-Token': signature,
        'X-App-Access-Ts': ts.toString(),
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub createApplicant failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      createdAt: data.createdAt,
      externalUserId: data.externalUserId,
    };
  }

  /**
   * Get applicant status and review result
   */
  async getApplicantStatus(applicantId: string): Promise<ApplicantStatusResponse> {
    const path = `/resources/applicants/${applicantId}/status`;
    const { signature, ts } = this.sign('GET', path);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'X-App-ID': this.appId,
        'X-App-Access-Token': signature,
        'X-App-Access-Ts': ts.toString(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub getApplicantStatus failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Create an access token for the Web SDK iframe
   */
  async createAccessToken(applicantId: string): Promise<AccessTokenResponse> {
    const path = `/resources/applicants/${applicantId}/accessTokens`;
    const { signature, ts } = this.sign('POST', path);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-App-ID': this.appId,
        'X-App-Access-Token': signature,
        'X-App-Access-Ts': ts.toString(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub createAccessToken failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get verification details (e.g., IDV result, facematch score)
   */
  async getVerification(applicantId: string, verificationId: string) {
    const path = `/resources/applicants/${applicantId}/verifications/${verificationId}`;
    const { signature, ts } = this.sign('GET', path);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'X-App-ID': this.appId,
        'X-App-Access-Token': signature,
        'X-App-Access-Ts': ts.toString(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub getVerification failed: ${response.status} ${error}`);
    }

    return response.json();
  }
}

// Singleton instance
let instance: SumsubClient | null = null;

export function getSumsubClient(): SumsubClient {
  if (!instance) {
    instance = new SumsubClient();
  }
  return instance;
}
