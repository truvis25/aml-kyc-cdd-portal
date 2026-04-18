import { RiskService } from '../risk.service';
import { RiskLevel } from '../../common/enums';

// Lightweight mock for PrismaService
const mockPrisma = {
  countryRisk: {
    findUnique: jest.fn().mockResolvedValue(null),
  },
  riskEngineConfig: {
    findUnique: jest.fn().mockResolvedValue(null),
  },
};

describe('RiskService', () => {
  let service: RiskService;

  beforeEach(() => {
    service = new RiskService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreToRiskLevel', () => {
    it('should return LOW for scores below 30', () => {
      expect(service.scoreToRiskLevel(0)).toBe(RiskLevel.LOW);
      expect(service.scoreToRiskLevel(15)).toBe(RiskLevel.LOW);
      expect(service.scoreToRiskLevel(29)).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM for scores 30-59', () => {
      expect(service.scoreToRiskLevel(30)).toBe(RiskLevel.MEDIUM);
      expect(service.scoreToRiskLevel(45)).toBe(RiskLevel.MEDIUM);
      expect(service.scoreToRiskLevel(59)).toBe(RiskLevel.MEDIUM);
    });

    it('should return HIGH for scores 60+', () => {
      expect(service.scoreToRiskLevel(60)).toBe(RiskLevel.HIGH);
      expect(service.scoreToRiskLevel(85)).toBe(RiskLevel.HIGH);
      expect(service.scoreToRiskLevel(100)).toBe(RiskLevel.HIGH);
    });
  });

  describe('getRouting', () => {
    it('should route to AUTO_APPROVE for low scores without hard triggers', () => {
      expect(service.getRouting(20, false)).toBe('AUTO_APPROVE');
    });

    it('should route to RM_REVIEW for medium scores', () => {
      expect(service.getRouting(45, false)).toBe('RM_REVIEW');
    });

    it('should route to MLRO_MANDATORY for high scores', () => {
      expect(service.getRouting(70, false)).toBe('MLRO_MANDATORY');
    });

    it('should route to MLRO_MANDATORY when hard triggers present regardless of score', () => {
      expect(service.getRouting(10, true)).toBe('MLRO_MANDATORY');
      expect(service.getRouting(20, true)).toBe('MLRO_MANDATORY');
    });
  });

  describe('calculateRisk', () => {
    it('should detect sanctions hit as hard trigger', async () => {
      const result = await service.calculateRisk({
        countryCode: 'AE',
        clientType: 'INDIVIDUAL',
        ownershipComplexity: 0,
        hasPEPHit: false,
        hasSanctionsHit: true,
        documentVerificationConfidence: 95,
        expectedTransactionExposure: 'LOW',
        hasUBOMissing: false,
        isTrustOrEscrow: false,
      });

      expect(result.autoEscalate).toBe(true);
      expect(result.escalationReasons).toContain('SANCTIONS_HIT');
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should detect missing UBO as hard trigger', async () => {
      const result = await service.calculateRisk({
        countryCode: 'AE',
        clientType: 'LEGAL_ENTITY',
        ownershipComplexity: 2,
        hasPEPHit: false,
        hasSanctionsHit: false,
        documentVerificationConfidence: 80,
        expectedTransactionExposure: 'MEDIUM',
        hasUBOMissing: true,
        isTrustOrEscrow: false,
      });

      expect(result.autoEscalate).toBe(true);
      expect(result.escalationReasons).toContain('MISSING_UBO');
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should detect trust/escrow structure as hard trigger', async () => {
      const result = await service.calculateRisk({
        countryCode: 'AE',
        clientType: 'LEGAL_ENTITY',
        ownershipComplexity: 1,
        hasPEPHit: false,
        hasSanctionsHit: false,
        documentVerificationConfidence: 90,
        expectedTransactionExposure: 'LOW',
        hasUBOMissing: false,
        isTrustOrEscrow: true,
      });

      expect(result.autoEscalate).toBe(true);
      expect(result.escalationReasons).toContain('TRUST_OR_ESCROW_STRUCTURE');
    });

    it('should return LOW risk for clean individual with low exposure', async () => {
      const result = await service.calculateRisk({
        countryCode: 'AE',
        clientType: 'INDIVIDUAL',
        ownershipComplexity: 0,
        hasPEPHit: false,
        hasSanctionsHit: false,
        documentVerificationConfidence: 98,
        expectedTransactionExposure: 'LOW',
        hasUBOMissing: false,
        isTrustOrEscrow: false,
      });

      expect(result.autoEscalate).toBe(false);
      expect(result.escalationReasons).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return score within valid range (0-100)', async () => {
      const result = await service.calculateRisk({
        countryCode: 'US',
        clientType: 'LEGAL_ENTITY',
        ownershipComplexity: 5,
        hasPEPHit: true,
        hasSanctionsHit: false,
        documentVerificationConfidence: 60,
        expectedTransactionExposure: 'HIGH',
        hasUBOMissing: false,
        isTrustOrEscrow: false,
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
    });

    it('should include full breakdown in result', async () => {
      const result = await service.calculateRisk({
        countryCode: 'AE',
        clientType: 'INDIVIDUAL',
        ownershipComplexity: 0,
        hasPEPHit: false,
        hasSanctionsHit: false,
        documentVerificationConfidence: 90,
        expectedTransactionExposure: 'LOW',
        hasUBOMissing: false,
        isTrustOrEscrow: false,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.countryRisk).toBeDefined();
      expect(result.breakdown.pepHitRisk).toBeDefined();
      expect(result.breakdown.sanctionsHitRisk).toBeDefined();
      expect(result.breakdown.documentVerificationRisk).toBeDefined();
    });
  });
});
