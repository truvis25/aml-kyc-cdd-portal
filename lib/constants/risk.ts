// Risk band definitions
// Source of truth: PRD v1.0 Section 2.3 Risk-Based Routing Matrix
export enum RiskBand {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  UNACCEPTABLE = 'UNACCEPTABLE',
}

export const RISK_BAND_THRESHOLDS = {
  LOW: { min: 0, max: 30 },
  MEDIUM: { min: 31, max: 60 },
  HIGH: { min: 61, max: 80 },
  UNACCEPTABLE: { min: 81, max: 100 },
} as const;

export function getRiskBand(score: number): RiskBand {
  if (score <= 30) return RiskBand.LOW;
  if (score <= 60) return RiskBand.MEDIUM;
  if (score <= 80) return RiskBand.HIGH;
  return RiskBand.UNACCEPTABLE;
}

// Case queue types driven by risk band
export enum CaseQueueType {
  STANDARD_REVIEW = 'standard_review',
  EDD_REVIEW = 'edd_review',
  SENIOR_ESCALATION = 'senior_escalation',
  SANCTIONS_REVIEW = 'sanctions_review',
}

export function getCaseQueueType(riskBand: RiskBand): CaseQueueType {
  switch (riskBand) {
    case RiskBand.MEDIUM:
      return CaseQueueType.STANDARD_REVIEW;
    case RiskBand.HIGH:
      return CaseQueueType.EDD_REVIEW;
    case RiskBand.UNACCEPTABLE:
      return CaseQueueType.SENIOR_ESCALATION;
    default:
      return CaseQueueType.STANDARD_REVIEW;
  }
}

// Customer status
export enum CustomerStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// Document types per PRD Section 4.1.2
export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  RESIDENCY_PERMIT = 'residency_permit',
  PROOF_OF_ADDRESS = 'proof_of_address',
  TAX_RESIDENCY_CERT = 'tax_residency_cert',
  SOURCE_OF_WEALTH = 'source_of_wealth',
}
