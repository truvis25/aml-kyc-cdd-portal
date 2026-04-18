/**
 * Base interface for all integration adapters
 * Implements the Adapter Pattern for swappable integrations
 */
export interface IntegrationAdapter {
  readonly providerName: string;
  readonly isEnabled: boolean;
  healthCheck(): Promise<boolean>;
}

// ─────────────────────────────────────────────
// ID VERIFICATION ADAPTER
// ─────────────────────────────────────────────

export interface IdVerificationResult {
  success: boolean;
  verified: boolean;
  confidence: number; // 0-100
  livenessScore?: number;
  extractedData?: {
    fullName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    expiryDate?: string;
    nationality?: string;
  };
  rawResponse?: Record<string, unknown>;
}

export interface IdVerificationAdapter extends IntegrationAdapter {
  verifyDocument(
    documentBase64: string,
    documentType: string,
    selfieBase64?: string,
  ): Promise<IdVerificationResult>;
}

// ─────────────────────────────────────────────
// SANCTIONS SCREENING ADAPTER
// ─────────────────────────────────────────────

export interface ScreeningHit {
  listName: string;
  listType: 'SANCTIONS' | 'PEP' | 'ADVERSE_MEDIA';
  matchScore: number; // 0-100
  entityName: string;
  entityType?: string;
  reason?: string;
  programName?: string;
  aliases?: string[];
  rawData?: Record<string, unknown>;
}

export interface ScreeningResult {
  success: boolean;
  cleared: boolean;
  hits: ScreeningHit[];
  searchId: string;
  searchedAt: Date;
  rawResponse?: Record<string, unknown>;
}

export interface SanctionsScreeningAdapter extends IntegrationAdapter {
  screenIndividual(params: {
    fullName: string;
    dateOfBirth?: string;
    nationality?: string;
    passportNumber?: string;
  }): Promise<ScreeningResult>;

  screenEntity(params: {
    companyName: string;
    jurisdiction?: string;
    registrationNumber?: string;
  }): Promise<ScreeningResult>;
}

// ─────────────────────────────────────────────
// EMAIL SERVICE ADAPTER
// ─────────────────────────────────────────────

export interface EmailMessage {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    mimeType: string;
  }>;
}

export interface EmailAdapter extends IntegrationAdapter {
  sendEmail(message: EmailMessage): Promise<{ messageId: string }>;
}

// ─────────────────────────────────────────────
// SMS OTP ADAPTER
// ─────────────────────────────────────────────

export interface SmsOtpAdapter extends IntegrationAdapter {
  sendOtp(phoneNumber: string, otp: string): Promise<{ messageId: string }>;
  verifyOtp?(phoneNumber: string, otp: string): Promise<boolean>;
}

// ─────────────────────────────────────────────
// STORAGE ADAPTER (S3-compatible)
// ─────────────────────────────────────────────

export interface StorageUploadResult {
  key: string;
  bucket: string;
  etag: string;
  location: string;
}

export interface StorageAdapter extends IntegrationAdapter {
  upload(params: {
    key: string;
    body: Buffer;
    mimeType: string;
    metadata?: Record<string, string>;
    encrypt?: boolean;
  }): Promise<StorageUploadResult>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
