import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  clientId?: string;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    // Strip any PII from details before logging
    const sanitizedDetails = entry.details
      ? this.sanitizeDetails(entry.details)
      : undefined;

    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        clientId: entry.clientId,
        action: entry.action as AuditAction,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: sanitizedDetails as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  async getLogsForClient(clientId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getLogsForUser(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllLogs(filters: {
    from?: Date;
    to?: Date;
    action?: AuditAction;
    userId?: string;
    clientId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from && { gte: filters.from }),
        ...(filters.to && { lte: filters.to }),
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 100,
      skip: filters.offset ?? 0,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        client: {
          select: { id: true, fullName: true, companyName: true },
        },
      },
    });
  }

  /**
   * Remove PII fields from audit log details (UAE PDPL compliance)
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const PII_FIELDS = [
      'passportNumber', 'password', 'mfaSecret', 'taxId',
      'ssn', 'bankAccountNumber', 'creditCard',
    ];
    const sanitized = { ...details };
    for (const field of PII_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
