import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IdVerificationAdapter,
  IdVerificationResult,
} from './integration.interfaces';

/**
 * Mock/stub ID verification adapter.
 * Replace with real provider (Jumio, Onfido, Veriff, etc.)
 * by implementing IdVerificationAdapter interface.
 */
@Injectable()
export class MockIdVerificationAdapter implements IdVerificationAdapter {
  readonly providerName = 'MOCK_ID_VERIFICATION';
  readonly isEnabled: boolean;
  private readonly logger = new Logger(MockIdVerificationAdapter.name);

  constructor(private configService: ConfigService) {
    this.isEnabled =
      configService.get('ID_VERIFICATION_PROVIDER_ENABLED', 'false') === 'true';
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async verifyDocument(
    documentBase64: string,
    documentType: string,
    selfieBase64?: string,
  ): Promise<IdVerificationResult> {
    this.logger.log(`Verifying document type: ${documentType}`);

    // In production: call real ID verification API
    return {
      success: true,
      verified: true,
      confidence: 95,
      livenessScore: selfieBase64 ? 92 : undefined,
      extractedData: {
        fullName: 'John Doe',
        documentNumber: 'MOCK123456',
        expiryDate: '2028-01-01',
        nationality: 'AE',
      },
    };
  }
}
