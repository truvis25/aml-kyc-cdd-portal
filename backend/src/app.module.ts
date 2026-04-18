import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { DocumentsModule } from './documents/documents.module';
import { RiskModule } from './risk/risk.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AuditModule } from './audit/audit.module';
import { MlroModule } from './mlro/mlro.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    DocumentsModule,
    RiskModule,
    OnboardingModule,
    AuditModule,
    MlroModule,
    IntegrationsModule,
  ],
})
export class AppModule {}
