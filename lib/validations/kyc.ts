import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
const iso2 = z.string().length(2).toUpperCase();

export const KycIdentitySchema = z.object({
  full_name: z.string().min(2).max(200),
  date_of_birth: isoDate,
  nationality: iso2,
  country_of_residence: iso2,
  id_type: z.enum(['passport', 'national_id', 'residence_permit', 'driving_licence']),
  id_number: z.string().min(3).max(50),
  id_expiry: isoDate,
  id_issuing_country: iso2,
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
});

export type KycIdentityInput = z.infer<typeof KycIdentitySchema>;
