import { z } from 'zod';

const DocumentTypeEnum = z.enum([
  'passport',
  'national_id',
  'residence_permit',
  'driving_licence',
  'proof_of_address',
  'bank_statement',
  'utility_bill',
  'trade_license',
  'memorandum_of_association',
  'other',
]);

export const TenantConfigSchema = z.object({
  modules: z.object({
    individual_kyc: z.boolean(),
    corporate_kyb: z.boolean(),
    edd_enabled: z.boolean(),
    ongoing_screening: z.boolean(),
  }),
  documents: z.object({
    required_individual: z.array(DocumentTypeEnum).max(10),
    required_corporate: z.array(DocumentTypeEnum).max(10),
  }),
  risk_thresholds: z
    .object({
      medium: z.number().int().min(0).max(100),
      high: z.number().int().min(0).max(100),
      unacceptable: z.number().int().min(0).max(100),
    })
    .refine(
      (t) => t.medium < t.high && t.high < t.unacceptable,
      'Thresholds must satisfy medium < high < unacceptable',
    ),
  screening: z.object({
    adverse_media_enabled: z.boolean(),
    // 0-100; hits below this score are filtered out before persistence.
    // Lower = more sensitive, higher analyst load.
    adverse_media_min_confidence: z.number().int().min(0).max(100),
  }),
  branding: z.object({
    company_name: z.string().min(1).max(200).nullable(),
    logo_url: z.string().url().nullable(),
  }),
  uae_pass: z.object({
    enabled: z.boolean(),
    required_assurance_level: z.enum(['SOP2', 'SOP3']),
  }),
  flags: z.record(z.string(), z.union([z.boolean(), z.string(), z.number()])),
});

export const TenantConfigUpdateSchema = z.object({
  config: TenantConfigSchema,
  notes: z.string().max(2000).optional(),
});

export type TenantConfigUpdateInput = z.infer<typeof TenantConfigUpdateSchema>;
