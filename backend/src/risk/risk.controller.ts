import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RiskService } from './risk.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('risk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('calculate')
  @Roles(UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN, UserRole.MLRO)
  @ApiOperation({ summary: 'Calculate risk score for a client' })
  @ApiResponse({ status: 200, description: 'Risk score calculated' })
  async calculateRisk(@Body() body: any) {
    return this.riskService.calculateRisk(body);
  }

  @Get('routing/:score')
  @Roles(UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN, UserRole.MLRO, UserRole.RELATIONSHIP_MANAGER)
  @ApiOperation({ summary: 'Get routing decision based on risk score' })
  getRouting(@Param('score') score: string) {
    const numericScore = parseInt(score, 10);
    return {
      score: numericScore,
      routing: this.riskService.getRouting(numericScore, false),
    };
  }
}
