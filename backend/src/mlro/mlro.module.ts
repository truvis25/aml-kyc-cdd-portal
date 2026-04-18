import { Module } from '@nestjs/common';
import { MlroService } from './mlro.service';
import { MlroController } from './mlro.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MlroController],
  providers: [MlroService],
  exports: [MlroService],
})
export class MlroModule {}
