import { OnboardingService } from '../onboarding.service';
import { OnboardingStatus, UserRole } from '../../common/enums';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  client: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  statusHistory: {
    create: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('OnboardingService — State Machine', () => {
  let service: OnboardingService;

  beforeEach(() => {
    service = new OnboardingService(mockPrisma as any, mockAuditService as any);
    jest.clearAllMocks();
  });

  describe('transitionStatus', () => {
    it('should transition from NEW to EMAIL_VERIFIED', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.NEW,
      });
      mockPrisma.client.update.mockResolvedValue({});
      mockPrisma.statusHistory.create.mockResolvedValue({});

      await expect(
        service.transitionStatus({
          clientId: 'client-1',
          targetStatus: OnboardingStatus.EMAIL_VERIFIED,
          userId: 'user-1',
          userRole: UserRole.KYC_ANALYST,
        }),
      ).resolves.not.toThrow();

      expect(mockPrisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'client-1' },
          data: expect.objectContaining({ status: OnboardingStatus.EMAIL_VERIFIED }),
        }),
      );
    });

    it('should reject invalid transition (NEW → APPROVED)', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.NEW,
      });

      await expect(
        service.transitionStatus({
          clientId: 'client-1',
          targetStatus: OnboardingStatus.APPROVED,
          userId: 'user-1',
          userRole: UserRole.COMPLIANCE_ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject MLRO approval by non-MLRO role', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.PENDING_MLRO,
      });

      await expect(
        service.transitionStatus({
          clientId: 'client-1',
          targetStatus: OnboardingStatus.APPROVED,
          userId: 'user-1',
          userRole: UserRole.RELATIONSHIP_MANAGER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow MLRO to approve from PENDING_MLRO', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.PENDING_MLRO,
      });
      mockPrisma.client.update.mockResolvedValue({});
      mockPrisma.statusHistory.create.mockResolvedValue({});

      await expect(
        service.transitionStatus({
          clientId: 'client-1',
          targetStatus: OnboardingStatus.APPROVED,
          userId: 'mlro-1',
          userRole: UserRole.MLRO,
        }),
      ).resolves.not.toThrow();
    });

    it('should set rejectedAt when transitioning to REJECTED', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.PENDING_MLRO,
      });
      mockPrisma.client.update.mockResolvedValue({});
      mockPrisma.statusHistory.create.mockResolvedValue({});

      await service.transitionStatus({
        clientId: 'client-1',
        targetStatus: OnboardingStatus.REJECTED,
        userId: 'mlro-1',
        userRole: UserRole.MLRO,
        reason: 'Sanctions hit confirmed',
      });

      expect(mockPrisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rejectionReason: 'Sanctions hit confirmed',
            rejectedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should log audit entry on every transition', async () => {
      mockPrisma.client.findUniqueOrThrow.mockResolvedValue({
        id: 'client-1',
        status: OnboardingStatus.RISK_ASSESSED,
      });
      mockPrisma.client.update.mockResolvedValue({});
      mockPrisma.statusHistory.create.mockResolvedValue({});

      await service.transitionStatus({
        clientId: 'client-1',
        targetStatus: OnboardingStatus.PENDING_MLRO,
        userId: 'rm-1',
        userRole: UserRole.RELATIONSHIP_MANAGER,
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'rm-1',
          clientId: 'client-1',
          action: 'STATUS_CHANGE',
        }),
      );
    });
  });

  describe('getValidNextStates', () => {
    it('should return valid transitions from RISK_ASSESSED', () => {
      const valid = service.getValidNextStates(OnboardingStatus.RISK_ASSESSED);
      expect(valid).toContain(OnboardingStatus.PENDING_RM_REVIEW);
      expect(valid).toContain(OnboardingStatus.PENDING_MLRO);
      expect(valid).toContain(OnboardingStatus.APPROVED);
    });

    it('should return empty array for terminal states', () => {
      expect(service.getValidNextStates(OnboardingStatus.REJECTED)).toHaveLength(0);
      expect(service.getValidNextStates(OnboardingStatus.CLOSED)).toHaveLength(0);
    });
  });
});
