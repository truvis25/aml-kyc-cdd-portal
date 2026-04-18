import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.COMPLIANCE_ADMIN, UserRole.AUDITOR, UserRole.MLRO)
  @ApiOperation({ summary: 'Get all audit logs (paginated)' })
  async getAllLogs(
    @Query('clientId') clientId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getAllLogs({
      clientId,
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('client/:clientId')
  @Roles(UserRole.COMPLIANCE_ADMIN, UserRole.AUDITOR, UserRole.MLRO, UserRole.KYC_ANALYST)
  @ApiOperation({ summary: 'Get audit logs for a specific client' })
  async getClientLogs(@Query('clientId') clientId: string) {
    return this.auditService.getLogsForClient(clientId);
  }
}
