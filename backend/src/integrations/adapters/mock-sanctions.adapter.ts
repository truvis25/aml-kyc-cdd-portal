import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SanctionsScreeningAdapter,
  ScreeningResult,
} from './integration.interfaces';

/**
 * Mock/stub sanctions screening adapter.
 * Replace with real provider (ComplyAdvantage, Refinitiv, etc.)
 * by implementing SanctionsScreeningAdapter interface.
 */
@Injectable()
export class MockSanctionsAdapter implements SanctionsScreeningAdapter {
  readonly providerName = 'MOCK_SANCTIONS_PROVIDER';
  readonly isEnabled: boolean;
  private readonly logger = new Logger(MockSanctionsAdapter.name);

  constructor(private configService: ConfigService) {
    this.isEnabled = configService.get('SANCTIONS_PROVIDER_ENABLED', 'false') === 'true';
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async screenIndividual(params: {
    fullName: string;
    dateOfBirth?: string;
    nationality?: string;
    passportNumber?: string;
  }): Promise<ScreeningResult> {
    this.logger.log(`Screening individual: ${params.fullName}`);

    // In production: call real sanctions API
    return {
      success: true,
      cleared: true,
      hits: [],
      searchId: `MOCK-${Date.now()}`,
      searchedAt: new Date(),
    };
  }

  async screenEntity(params: {
    companyName: string;
    jurisdiction?: string;
    registrationNumber?: string;
  }): Promise<ScreeningResult> {
    this.logger.log(`Screening entity: ${params.companyName}`);

    // In production: call real sanctions API
    return {
      success: true,
      cleared: true,
      hits: [],
      searchId: `MOCK-${Date.now()}`,
      searchedAt: new Date(),
    };
  }
}
