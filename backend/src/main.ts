import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AML/KYC/CDD Compliance Portal API')
    .setDescription(
      'Production-ready API for AML/KYC/CDD onboarding and compliance management',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & MFA')
    .addTag('clients', 'Client onboarding & management')
    .addTag('documents', 'Document upload & verification')
    .addTag('risk', 'Risk scoring engine')
    .addTag('screening', 'Sanctions, PEP & adverse media screening')
    .addTag('mlro', 'MLRO module & SAR management')
    .addTag('audit', 'Audit logs & compliance reports')
    .addTag('admin', 'Admin configuration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`AML/KYC/CDD Portal API running on port ${port}`);
}

bootstrap();
