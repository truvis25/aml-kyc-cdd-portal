import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel } from '../common/enums';

export interface RiskInputs {
  countryCode: string;
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  ownershipComplexity: number; // 0-10 (number of layers/entities)
  hasPEPHit: boolean;
  hasSanctionsHit: boolean;
  documentVerificationConfidence: number; // 0-100 from ID provider
  expectedTransactionExposure: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  hasUBOMissing: boolean;
  isTrustOrEscrow: boolean;
}

export interface RiskOutput {
  score: number;
  riskLevel: RiskLevel;
  breakdown: RiskBreakdown;
  autoEscalate: boolean;
  escalationReasons: string[];
}

export interface RiskBreakdown {
  countryRisk: number;
  clientTypeRisk: number;
  ownershipComplexityRisk: number;
  pepHitRisk: number;
  sanctionsHitRisk: number;
  documentVerificationRisk: number;
  transactionExposureRisk: number;
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  // Default weights (configurable via Admin UI / DB)
  private readonly DEFAULT_WEIGHTS = {
    countryRisk: 0.20,
    clientTypeRisk: 0.10,
    ownershipComplexityRisk: 0.15,
    pepHitRisk: 0.15,
    sanctionsHitRisk: 0.20,
    documentVerificationRisk: 0.10,
    transactionExposureRisk: 0.10,
  };

  private readonly EXPOSURE_SCORES: Record<string, number> = {
    LOW: 10,
    MEDIUM: 40,
    HIGH: 70,
    VERY_HIGH: 95,
  };

  constructor(private prisma: PrismaService) {}

  async calculateRisk(inputs: RiskInputs): Promise<RiskOutput> {
    const escalationReasons: string[] = [];

    // Hard trigger checks
    if (inputs.hasSanctionsHit) {
      escalationReasons.push('SANCTIONS_HIT');
    }
    if (inputs.isTrustOrEscrow) {
      escalationReasons.push('TRUST_OR_ESCROW_STRUCTURE');
    }
    if (inputs.hasUBOMissing) {
      escalationReasons.push('MISSING_UBO');
    }

    // Get country risk from DB or use default
    const countryRiskScore = await this.getCountryRiskScore(inputs.countryCode);

    // Calculate component scores (0-100 each)
    const breakdown: RiskBreakdown = {
      countryRisk: countryRiskScore,
      clientTypeRisk: this.getClientTypeRisk(inputs.clientType),
      ownershipComplexityRisk: this.getOwnershipComplexityRisk(inputs.ownershipComplexity),
      pepHitRisk: inputs.hasPEPHit ? 80 : 0,
      sanctionsHitRisk: inputs.hasSanctionsHit ? 100 : 0,
      documentVerificationRisk: this.getDocumentVerificationRisk(inputs.documentVerificationConfidence),
      transactionExposureRisk: this.EXPOSURE_SCORES[inputs.expectedTransactionExposure] ?? 40,
    };

    // Weighted sum
    const weights = await this.getWeights();
    const score = Math.round(
      breakdown.countryRisk * weights.countryRisk +
      breakdown.clientTypeRisk * weights.clientTypeRisk +
      breakdown.ownershipComplexityRisk * weights.ownershipComplexityRisk +
      breakdown.pepHitRisk * weights.pepHitRisk +
      breakdown.sanctionsHitRisk * weights.sanctionsHitRisk +
      breakdown.documentVerificationRisk * weights.documentVerificationRisk +
      breakdown.transactionExposureRisk * weights.transactionExposureRisk,
    );

    const finalScore = Math.min(100, Math.max(0, score));
    const riskLevel = this.scoreToRiskLevel(finalScore);

    // Force HIGH if any hard triggers
    const effectiveRiskLevel =
      escalationReasons.length > 0 ? RiskLevel.HIGH : riskLevel;

    this.logger.log(
      `Risk calculated: score=${finalScore}, level=${effectiveRiskLevel}, triggers=${escalationReasons.join(',')}`,
    );

    return {
      score: finalScore,
      riskLevel: effectiveRiskLevel,
      breakdown,
      autoEscalate: escalationReasons.length > 0,
      escalationReasons,
    };
  }

  scoreToRiskLevel(score: number): RiskLevel {
    if (score < 30) return RiskLevel.LOW;
    if (score < 60) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }

  private getClientTypeRisk(clientType: string): number {
    // Legal entities inherently more complex
    return clientType === 'LEGAL_ENTITY' ? 40 : 10;
  }

  private getOwnershipComplexityRisk(layers: number): number {
    // 0 layers = 0 risk, 10+ layers = 100
    return Math.min(100, layers * 10);
  }

  private getDocumentVerificationRisk(confidence: number): number {
    // Low confidence = high risk; invert the confidence score
    return Math.max(0, 100 - confidence);
  }

  private async getCountryRiskScore(countryCode: string): Promise<number> {
    try {
      const countryRisk = await this.prisma.countryRisk.findUnique({
        where: { countryCode },
      });
      return countryRisk?.riskScore ?? 30; // Default medium-low
    } catch {
      return 30;
    }
  }

  private async getWeights(): Promise<Record<string, number>> {
    try {
      const config = await this.prisma.riskEngineConfig.findUnique({
        where: { configKey: 'RISK_WEIGHTS' },
      });
      if (config?.configValue) {
        return config.configValue as Record<string, number>;
      }
    } catch {
      // Fallback to defaults
    }
    return this.DEFAULT_WEIGHTS;
  }

  /**
   * Determine routing based on risk score:
   * 0-29   → auto approve (LOW)
   * 30-59  → RM review (MEDIUM)
   * 60+    → MLRO mandatory (HIGH)
   */
  getRouting(score: number, hasHardTriggers: boolean): 'AUTO_APPROVE' | 'RM_REVIEW' | 'MLRO_MANDATORY' {
    if (hasHardTriggers || score >= 60) return 'MLRO_MANDATORY';
    if (score >= 30) return 'RM_REVIEW';
    return 'AUTO_APPROVE';
  }
}
