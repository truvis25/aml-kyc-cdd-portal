import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.KYC_ANALYST,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.CLIENT,
  )
  @ApiOperation({ summary: 'Create new client onboarding record' })
  async create(@Body() body: any, @Request() req: any) {
    return this.clientsService.create(body, req.user.id);
  }

  @Get()
  @Roles(
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.KYC_ANALYST,
    UserRole.MLRO,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'List clients with optional filters' })
  async findAll(
    @Query('status') status?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('clientType') clientType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.clientsService.findAll({
      status,
      riskLevel,
      clientType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.KYC_ANALYST,
    UserRole.MLRO,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get client details by ID' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }
}
