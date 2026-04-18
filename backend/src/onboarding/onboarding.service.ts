import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  OnboardingStatus,
  UserRole,
  VALID_TRANSITIONS,
  TRANSITION_PERMISSIONS,
} from '../common/enums';

export interface TransitionRequest {
  clientId: string;
  targetStatus: OnboardingStatus;
  userId: string;
  userRole: UserRole;
  reason?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async transitionStatus(request: TransitionRequest): Promise<void> {
    const { clientId, targetStatus, userId, userRole, reason, metadata } = request;

    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    const currentStatus = client.status as OnboardingStatus;

    // Validate transition is allowed
    this.validateTransition(currentStatus, targetStatus, userRole);

    // Perform transition
    await this.prisma.$transaction(async (tx) => {
      // Update client status
      await tx.client.update({
        where: { id: clientId },
        data: {
          status: targetStatus,
          ...(targetStatus === OnboardingStatus.APPROVED && { approvedAt: new Date() }),
          ...(targetStatus === OnboardingStatus.REJECTED && {
            rejectedAt: new Date(),
            rejectionReason: reason,
          }),
        },
      });

      // Record in immutable status history
      await tx.statusHistory.create({
        data: {
          clientId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          changedById: userId,
          reason,
          metadata: metadata as any,
        },
      });
    });

    // Log the action
    await this.auditService.log({
      userId,
      clientId,
      action: 'STATUS_CHANGE',
      details: {
        fromStatus: currentStatus,
        toStatus: targetStatus,
        reason,
      },
    });

    this.logger.log(
      `Client ${clientId} transitioned: ${currentStatus} → ${targetStatus} by user ${userId}`,
    );
  }

  private validateTransition(
    from: OnboardingStatus,
    to: OnboardingStatus,
    userRole: UserRole,
  ): void {
    // Check if transition is structurally valid
    const validNextStates = VALID_TRANSITIONS[from] ?? [];
    if (!validNextStates.includes(to)) {
      throw new BadRequestException(
        `Invalid transition: ${from} → ${to}. Valid transitions: ${validNextStates.join(', ')}`,
      );
    }

    // Check if user role is permitted to make this transition
    const transitionKey = `${from}_${to}`;
    const permittedRoles = TRANSITION_PERMISSIONS[transitionKey];

    if (permittedRoles && !permittedRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Role ${userRole} is not permitted to transition from ${from} to ${to}`,
      );
    }
  }

  async getStatusHistory(clientId: string) {
    return this.prisma.statusHistory.findMany({
      where: { clientId },
      orderBy: { changedAt: 'asc' },
      include: {
        client: { select: { id: true } },
      },
    });
  }

  async getCurrentStatus(clientId: string): Promise<OnboardingStatus> {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { status: true },
    });
    return client.status as OnboardingStatus;
  }

  getValidNextStates(currentStatus: OnboardingStatus): OnboardingStatus[] {
    return VALID_TRANSITIONS[currentStatus] ?? [];
  }
}
