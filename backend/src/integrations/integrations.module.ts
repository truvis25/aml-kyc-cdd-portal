import { Module } from '@nestjs/common';
import { MockSanctionsAdapter } from './adapters/mock-sanctions.adapter';
import { MockIdVerificationAdapter } from './adapters/mock-id-verification.adapter';

@Module({
  providers: [MockSanctionsAdapter, MockIdVerificationAdapter],
  exports: [MockSanctionsAdapter, MockIdVerificationAdapter],
})
export class IntegrationsModule {}
