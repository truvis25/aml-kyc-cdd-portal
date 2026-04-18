import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MlroService } from './mlro.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { IsString, IsOptional } from 'class-validator';

class CreateSARDto {
  @IsString()
  clientId: string;

  @IsString()
  subject: string;

  @IsString()
  narrative: string;
}

@ApiTags('mlro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mlro')
export class MlroController {
  constructor(private readonly mlroService: MlroService) {}

  @Post('sar')
  @Roles(UserRole.MLRO, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({ summary: 'Create a Suspicious Activity Report (SAR)' })
  async createSAR(@Body() dto: CreateSARDto, @Request() req: any) {
    return this.mlroService.createSAR({
      clientId: dto.clientId,
      createdById: req.user.id,
      subject: dto.subject,
      narrative: dto.narrative,
    });
  }

  @Get('sar/:clientId')
  @Roles(UserRole.MLRO, UserRole.COMPLIANCE_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get SARs for a client' })
  async getSARs(@Param('clientId') clientId: string) {
    return this.mlroService.getSARsForClient(clientId);
  }

  @Post('export/:clientId')
  @Roles(UserRole.MLRO, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({ summary: 'Export compliance evidence bundle' })
  async exportBundle(@Param('clientId') clientId: string, @Request() req: any) {
    return this.mlroService.exportComplianceBundle(clientId, req.user.id);
  }

  @Get('edd-checklist')
  @Roles(UserRole.MLRO, UserRole.COMPLIANCE_ADMIN, UserRole.KYC_ANALYST)
  @ApiOperation({ summary: 'Get EDD checklist items' })
  getEDDChecklist() {
    return this.mlroService.getEDDChecklist();
  }
}
