import { z } from 'zod';
import {
  isEmiratesIdChecksumValid,
  isEmiratesIdFormat,
  normaliseEmiratesId,
} from '@/modules/emirates-id/parser';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
const iso2 = z.string().length(2).toUpperCase();

export const BankAccountSchema = z.object({
  iban:           z.string().min(5).max(34).optional(),
  bank_name:      z.string().min(2).max(200).optional(),
  account_number: z.string().min(3).max(50).optional(),
  swift_code:     z.string().min(8).max(11).optional(),
}).optional();

/**
 * Emirates ID — 784-YYYY-NNNNNNN-N. Always normalised to canonical dashed
 * form before validation. We accept an empty-string / undefined / null as
 * "not provided"; the conditional-required check happens at the schema
 * level via .superRefine because requiredness depends on other fields.
 */
const EmiratesIdSchema = z
  .string()
  .max(64)
  .nullish()
  .transform((v) => {
    if (v === undefined || v === null) return null;
    const trimmed = v.trim();
    if (trimmed.length === 0) return null;
    return normaliseEmiratesId(trimmed) ?? trimmed; // keep raw on parse failure so refine reports it
  })
  .refine((v) => v === null || isEmiratesIdFormat(v), {
    message: 'Emirates ID must be 15 digits in the form 784-YYYY-NNNNNNN-N',
  })
  .refine((v) => v === null || isEmiratesIdChecksumValid(v), {
    message: 'Emirates ID checksum is invalid',
  });

export const KycIdentitySchema = z
  .object({
    full_name: z.string().min(2).max(200),
    date_of_birth: isoDate,
    nationality: iso2,
    country_of_residence: iso2,
    id_type: z.enum(['passport', 'national_id', 'residence_permit', 'driving_licence']),
    id_number: z.string().min(3).max(50),
    id_expiry: isoDate,
    id_issuing_country: iso2,
    // First-class Emirates ID, conditionally required (see superRefine below).
    emirates_id_number: EmiratesIdSchema,
    // Contact
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    address_line1: z.string().min(3).max(200),
    address_line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    postal_code: z.string().min(1).max(20),
    country: iso2,
    // Compliance
    occupation: z.string().min(2).max(200),
    employer: z.string().max(200).optional(),
    pep_status: z.boolean(),
    pep_details: z.string().max(1000).optional(),
    dual_nationality: iso2.optional().nullable(),
    source_of_funds: z.string().min(2).max(500),
    purpose_of_relationship: z.string().min(2).max(500),
    bank_account: BankAccountSchema,
  })
  .superRefine((data, ctx) => {
    // Per FINAL_LAUNCH_PLAN §2.2: any UAE national or UAE resident must
    // produce an Emirates ID, even if their primary id_type is a passport.
    const requiresEid =
      data.nationality === 'AE' || data.country_of_residence === 'AE';
    if (requiresEid && !data.emirates_id_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emirates_id_number'],
        message: 'Emirates ID is required for UAE nationals and UAE residents',
      });
    }
  });

export type KycIdentityInput = z.infer<typeof KycIdentitySchema>;
