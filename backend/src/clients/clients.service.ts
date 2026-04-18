import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(data: any, creatorId: string) {
    // Validate UBOs for legal entities
    if (data.clientType === 'LEGAL_ENTITY') {
      const ubos = data.ubos ?? [];
      const hasValidUBO = ubos.some((u: any) => u.ownershipPercentage >= 25);
      if (ubos.length === 0 || !hasValidUBO) {
        // Auto-escalate: flag missing UBO
        data.missingUBO = true;
      }
    }

    const client = await this.prisma.client.create({
      data: {
        clientType: data.clientType,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationality: data.nationality,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
        residentialAddress: data.residentialAddress,
        occupation: data.occupation,
        taxResidence: data.taxResidence,
        purposeOfRelationship: data.purposeOfRelationship,
        companyName: data.companyName,
        jurisdiction: data.jurisdiction,
        registrationNumber: data.registrationNumber,
        dateOfIncorporation: data.dateOfIncorporation ? new Date(data.dateOfIncorporation) : undefined,
        registeredAddress: data.registeredAddress,
        businessActivity: data.businessActivity,
        directors: data.directors
          ? { create: data.directors }
          : undefined,
        authorizedSignatories: data.authorizedSignatories
          ? { create: data.authorizedSignatories }
          : undefined,
        ubos: data.ubos
          ? { create: data.ubos }
          : undefined,
      },
      include: {
        directors: true,
        authorizedSignatories: true,
        ubos: true,
      },
    });

    await this.auditService.log({
      userId: creatorId,
      clientId: client.id,
      action: 'STATUS_CHANGE',
      details: { action: 'CLIENT_CREATED', clientType: data.clientType },
    });

    return client;
  }

  async findAll(filters: {
    status?: string;
    riskLevel?: string;
    clientType?: string;
    rmId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.clientType) where.clientType = filters.clientType;
    if (filters.rmId) where.relationshipManagerId = filters.rmId;

    return this.prisma.client.findMany({
      where,
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
      orderBy: { createdAt: 'desc' },
      include: {
        relationshipManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { documents: true, screeningResults: true },
        },
      },
    });
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        directors: true,
        authorizedSignatories: true,
        ubos: true,
        documents: { where: { status: { not: 'REJECTED' } } },
        screeningResults: { orderBy: { runAt: 'desc' } },
        riskScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }
}
