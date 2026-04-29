import { z } from 'zod';

// Sumsub API Request/Response schemas

export const CreateApplicantRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dob: z.string().optional(), // YYYY-MM-DD
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
  externalUserId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateApplicantRequest = z.infer<typeof CreateApplicantRequestSchema>;

export const CreateApplicantResponseSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  externalUserId: z.string().optional(),
});

export type CreateApplicantResponse = z.infer<typeof CreateApplicantResponseSchema>;

export const ApplicantStatusResponseSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  type: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  status: z.enum(['pending', 'uploaded', 'onReevaluate', 'queued', 'processing', 'prechecked', 'completed']),
  reviewStatus: z.enum(['onReview', 'completed', 'rejected', 'approved']),
  reviewResult: z.object({
    reviewAnswer: z.enum(['GREEN', 'YELLOW', 'RED']),
    reasons: z.array(z.string()).optional(),
    reviewRejectType: z.enum(['RETRY', 'DECLINE']).optional(),
  }).optional(),
});

export type ApplicantStatusResponse = z.infer<typeof ApplicantStatusResponseSchema>;

export const AccessTokenResponseSchema = z.object({
  token: z.string(),
  externalUserId: z.string().optional(),
});

export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;

export const VerificationSchema = z.object({
  id: z.string(),
  type: z.string(), // IDV, SELFIE, PROOF_OF_ADDRESS, etc
  status: z.string(), // pending, completed
  verified: z.boolean().optional(),
});

export type Verification = z.infer<typeof VerificationSchema>;

// Webhook event (applicantReviewed)
export const ApplicantReviewedWebhookSchema = z.object({
  applicantId: z.string(),
  externalUserId: z.string().optional(),
  applicantType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  eventType: z.literal('applicantReviewed'),
  inspectionId: z.string().optional(),
  correlationId: z.string().optional(),
  reviewResult: z.object({
    reviewAnswer: z.enum(['GREEN', 'YELLOW', 'RED']),
    reasons: z.array(z.string()).optional(),
    reviewRejectType: z.enum(['RETRY', 'DECLINE']).optional(),
  }),
  timestamp: z.number(),
});

export type ApplicantReviewedWebhook = z.infer<typeof ApplicantReviewedWebhookSchema>;
