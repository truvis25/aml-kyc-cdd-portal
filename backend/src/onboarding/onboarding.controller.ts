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
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, OnboardingStatus } from '../common/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class TransitionDto {
  @IsEnum(OnboardingStatus)
  targetStatus: OnboardingStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post(':clientId/transition')
  @Roles(
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.KYC_ANALYST,
    UserRole.MLRO,
    UserRole.COMPLIANCE_ADMIN,
  )
  @ApiOperation({ summary: 'Transition client onboarding status' })
  async transitionStatus(
    @Param('clientId') clientId: string,
    @Body() dto: TransitionDto,
    @Request() req: any,
  ) {
    await this.onboardingService.transitionStatus({
      clientId,
      targetStatus: dto.targetStatus,
      userId: req.user.id,
      userRole: req.user.role,
      reason: dto.reason,
    });
    return { success: true, newStatus: dto.targetStatus };
  }

  @Get(':clientId/status')
  @ApiOperation({ summary: 'Get current onboarding status' })
  async getCurrentStatus(@Param('clientId') clientId: string) {
    const status = await this.onboardingService.getCurrentStatus(clientId);
    return {
      status,
      validNextStates: this.onboardingService.getValidNextStates(status),
    };
  }

  @Get(':clientId/history')
  @ApiOperation({ summary: 'Get onboarding status history' })
  async getStatusHistory(@Param('clientId') clientId: string) {
    return this.onboardingService.getStatusHistory(clientId);
  }
}
