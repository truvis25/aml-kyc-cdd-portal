import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async uploadDocument(params: {
    clientId: string;
    uploadedById: string;
    documentType: string;
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    uploadedFromIp?: string;
    expiresAt?: Date;
  }) {
    // Validate file size
    if (params.fileBuffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 20MB limit');
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
      throw new BadRequestException(
        `File type not allowed. Accepted: PDF, JPEG, PNG`,
      );
    }

    // Calculate SHA-256 checksum
    const sha256Checksum = crypto
      .createHash('sha256')
      .update(params.fileBuffer)
      .digest('hex');

    // Generate storage key (in production: upload to S3-compatible storage)
    const storageKey = `documents/${params.clientId}/${Date.now()}-${params.fileName}`;

    // In production: run virus scan before persistence
    const virusScanPassed = await this.runVirusScan(params.fileBuffer);

    if (!virusScanPassed) {
      throw new BadRequestException('File failed virus scan');
    }

    const document = await this.prisma.document.create({
      data: {
        clientId: params.clientId,
        uploadedById: params.uploadedById,
        documentType: params.documentType as any,
        fileName: params.fileName,
        fileSize: params.fileBuffer.length,
        mimeType: params.mimeType,
        storageKey,
        sha256Checksum,
        virusScanPassed,
        uploadedFromIp: params.uploadedFromIp,
        expiresAt: params.expiresAt,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: params.fileName,
        },
      },
    });

    await this.auditService.log({
      userId: params.uploadedById,
      clientId: params.clientId,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: document.id,
      details: {
        documentType: params.documentType,
        fileName: params.fileName,
        fileSize: params.fileBuffer.length,
        sha256: sha256Checksum,
      },
      ipAddress: params.uploadedFromIp,
    });

    return document;
  }

  async getDocumentsForClient(clientId: string) {
    return this.prisma.document.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  private async runVirusScan(fileBuffer: Buffer): Promise<boolean> {
    // In production: integrate with ClamAV or cloud virus scanning service
    // For now, return true (stub)
    this.logger.log(`Virus scan stub: ${fileBuffer.length} bytes checked`);
    return true;
  }
}
