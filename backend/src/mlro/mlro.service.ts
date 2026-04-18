import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MlroService {
  private readonly logger = new Logger(MlroService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createSAR(data: {
    clientId: string;
    createdById: string;
    subject: string;
    narrative: string;
    suspiciousActivity?: Record<string, unknown>;
  }) {
    const referenceNumber = `SAR-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const sar = await this.prisma.sAR.create({
      data: {
        clientId: data.clientId,
        createdById: data.createdById,
        referenceNumber,
        subject: data.subject,
        narrative: data.narrative,
        suspiciousActivity: data.suspiciousActivity as any,
        status: 'DRAFT',
      },
    });

    await this.auditService.log({
      userId: data.createdById,
      clientId: data.clientId,
      action: 'SAR_CREATED',
      entityType: 'SAR',
      entityId: sar.id,
      details: { referenceNumber, subject: data.subject },
    });

    return sar;
  }

  async getSARsForClient(clientId: string) {
    return this.prisma.sAR.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async exportComplianceBundle(clientId: string, exportedById: string) {
    // Gather all evidence
    const [client, documents, screenings, riskScores, auditLogs, sars] =
      await Promise.all([
        this.prisma.client.findUniqueOrThrow({
          where: { id: clientId },
          include: {
            directors: true,
            ubos: true,
            statusHistory: { orderBy: { changedAt: 'asc' } },
          },
        }),
        this.prisma.document.findMany({ where: { clientId } }),
        this.prisma.screeningResult.findMany({ where: { clientId } }),
        this.prisma.riskScore.findMany({ where: { clientId }, orderBy: { calculatedAt: 'desc' } }),
        this.prisma.auditLog.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.sAR.findMany({ where: { clientId } }),
      ]);

    await this.auditService.log({
      userId: exportedById,
      clientId,
      action: 'EXPORT',
      details: { bundleType: 'COMPLIANCE_BUNDLE', exportedAt: new Date().toISOString() },
    });

    this.logger.log(`Compliance bundle exported for client ${clientId} by user ${exportedById}`);

    // In production: generate PDF bundle and upload to secure storage
    return {
      referenceId: `BUNDLE-${Date.now()}`,
      clientId,
      exportedAt: new Date(),
      documentCount: documents.length,
      screeningCount: screenings.length,
      auditLogCount: auditLogs.length,
      sarCount: sars.length,
      // In production: return signed download URL
      bundleUrl: null,
    };
  }

  /**
   * EDD Checklist items for MLRO review
   */
  getEDDChecklist() {
    return [
      { id: 'source_of_wealth', label: 'Source of Wealth documented', required: true },
      { id: 'source_of_funds', label: 'Source of Funds verified', required: true },
      { id: 'business_purpose', label: 'Business purpose confirmed', required: true },
      { id: 'pep_declaration', label: 'PEP declaration obtained', required: false },
      { id: 'video_kyc', label: 'Video KYC completed', required: false },
      { id: 'bank_statement', label: 'Bank statements reviewed (6+ months)', required: true },
      { id: 'adverse_media', label: 'Adverse media check performed', required: true },
      { id: 'ubo_verified', label: 'UBO identity verified independently', required: true },
      { id: 'sanctions_clear', label: 'Sanctions screening clear', required: true },
    ];
  }
}
