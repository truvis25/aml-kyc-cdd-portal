export enum UserRole {
  CLIENT = 'CLIENT',
  RELATIONSHIP_MANAGER = 'RELATIONSHIP_MANAGER',
  KYC_ANALYST = 'KYC_ANALYST',
  MLRO = 'MLRO',
  COMPLIANCE_ADMIN = 'COMPLIANCE_ADMIN',
  AUDITOR = 'AUDITOR',
}

export enum OnboardingStatus {
  NEW = 'NEW',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  MOBILE_VERIFIED = 'MOBILE_VERIFIED',
  IN_PROGRESS = 'IN_PROGRESS',
  DOCUMENTS_UPLOADED = 'DOCUMENTS_UPLOADED',
  ID_VERIFIED = 'ID_VERIFIED',
  SCREENING_COMPLETED = 'SCREENING_COMPLETED',
  RISK_ASSESSED = 'RISK_ASSESSED',
  PENDING_RM_REVIEW = 'PENDING_RM_REVIEW',
  PENDING_MLRO = 'PENDING_MLRO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Define what transitions are valid
export const VALID_TRANSITIONS: Record<OnboardingStatus, OnboardingStatus[]> = {
  [OnboardingStatus.NEW]: [OnboardingStatus.EMAIL_VERIFIED, OnboardingStatus.REJECTED],
  [OnboardingStatus.EMAIL_VERIFIED]: [OnboardingStatus.MOBILE_VERIFIED, OnboardingStatus.REJECTED],
  [OnboardingStatus.MOBILE_VERIFIED]: [OnboardingStatus.IN_PROGRESS, OnboardingStatus.REJECTED],
  [OnboardingStatus.IN_PROGRESS]: [OnboardingStatus.DOCUMENTS_UPLOADED, OnboardingStatus.REJECTED],
  [OnboardingStatus.DOCUMENTS_UPLOADED]: [OnboardingStatus.ID_VERIFIED, OnboardingStatus.IN_PROGRESS, OnboardingStatus.REJECTED],
  [OnboardingStatus.ID_VERIFIED]: [OnboardingStatus.SCREENING_COMPLETED, OnboardingStatus.REJECTED],
  [OnboardingStatus.SCREENING_COMPLETED]: [OnboardingStatus.RISK_ASSESSED, OnboardingStatus.REJECTED],
  [OnboardingStatus.RISK_ASSESSED]: [OnboardingStatus.PENDING_RM_REVIEW, OnboardingStatus.PENDING_MLRO, OnboardingStatus.APPROVED, OnboardingStatus.REJECTED],
  [OnboardingStatus.PENDING_RM_REVIEW]: [OnboardingStatus.PENDING_MLRO, OnboardingStatus.APPROVED, OnboardingStatus.REJECTED],
  [OnboardingStatus.PENDING_MLRO]: [OnboardingStatus.APPROVED, OnboardingStatus.REJECTED],
  [OnboardingStatus.APPROVED]: [OnboardingStatus.ACTIVE, OnboardingStatus.REJECTED],
  [OnboardingStatus.REJECTED]: [],
  [OnboardingStatus.ACTIVE]: [OnboardingStatus.CLOSED],
  [OnboardingStatus.CLOSED]: [],
};

// Define which roles can trigger which transitions
export const TRANSITION_PERMISSIONS: Record<string, UserRole[]> = {
  [`${OnboardingStatus.NEW}_${OnboardingStatus.EMAIL_VERIFIED}`]: [UserRole.CLIENT, UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.EMAIL_VERIFIED}_${OnboardingStatus.MOBILE_VERIFIED}`]: [UserRole.CLIENT, UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.MOBILE_VERIFIED}_${OnboardingStatus.IN_PROGRESS}`]: [UserRole.CLIENT, UserRole.RELATIONSHIP_MANAGER, UserRole.KYC_ANALYST],
  [`${OnboardingStatus.IN_PROGRESS}_${OnboardingStatus.DOCUMENTS_UPLOADED}`]: [UserRole.CLIENT, UserRole.KYC_ANALYST],
  [`${OnboardingStatus.DOCUMENTS_UPLOADED}_${OnboardingStatus.ID_VERIFIED}`]: [UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.ID_VERIFIED}_${OnboardingStatus.SCREENING_COMPLETED}`]: [UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.SCREENING_COMPLETED}_${OnboardingStatus.RISK_ASSESSED}`]: [UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.RISK_ASSESSED}_${OnboardingStatus.PENDING_RM_REVIEW}`]: [UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.RISK_ASSESSED}_${OnboardingStatus.PENDING_MLRO}`]: [UserRole.RELATIONSHIP_MANAGER, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.RISK_ASSESSED}_${OnboardingStatus.APPROVED}`]: [UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.PENDING_RM_REVIEW}_${OnboardingStatus.PENDING_MLRO}`]: [UserRole.RELATIONSHIP_MANAGER, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.PENDING_RM_REVIEW}_${OnboardingStatus.APPROVED}`]: [UserRole.RELATIONSHIP_MANAGER, UserRole.COMPLIANCE_ADMIN],
  [`${OnboardingStatus.PENDING_MLRO}_${OnboardingStatus.APPROVED}`]: [UserRole.MLRO],
  [`${OnboardingStatus.APPROVED}_${OnboardingStatus.ACTIVE}`]: [UserRole.COMPLIANCE_ADMIN, UserRole.MLRO],
  [`${OnboardingStatus.ACTIVE}_${OnboardingStatus.CLOSED}`]: [UserRole.COMPLIANCE_ADMIN, UserRole.MLRO],
};
