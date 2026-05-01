import { z } from 'zod';

const ISO_CURRENCY = z.string().length(3).regex(/^[A-Z]{3}$/, 'ISO 4217 (e.g. AED, USD)');

/**
 * Zod schema for the EDD capture form. Mirrors the CHECK constraints in
 * migration 0038 — keep these in sync when adjusting validation bounds.
 */
export const EddCaptureSchema = z.object({
  source_of_wealth_narrative: z.string().min(10).max(50_000),
  source_of_funds_narrative: z.string().min(10).max(50_000),
  expected_annual_volume_aed: z
    .union([z.number().nonnegative(), z.null()])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  expected_currencies: z.array(ISO_CURRENCY).max(20).default([]),
  expected_counterparties: z
    .string()
    .max(5000)
    .nullish()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
  expected_payment_methods: z
    .array(z.enum(['wire', 'card', 'cash', 'crypto', 'cheque', 'standing_order', 'other']))
    .max(10)
    .default([]),
  pep_relationship_details: z
    .string()
    .max(10_000)
    .nullish()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
  supporting_document_ids: z.array(z.string().uuid()).max(50).default([]),
  reviewer_rationale: z
    .string()
    .max(10_000)
    .nullish()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
});

export type EddCaptureInput = z.infer<typeof EddCaptureSchema>;
