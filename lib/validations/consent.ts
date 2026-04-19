import { z } from 'zod';

export const ConsentSchema = z.object({
  customer_id: z.string().uuid(),
  data_processing: z.boolean().refine((v) => v === true, {
    message: 'Data processing consent is required',
  }),
  aml_screening: z.boolean().refine((v) => v === true, {
    message: 'AML screening consent is required',
  }),
  identity_verification: z.boolean().refine((v) => v === true, {
    message: 'Identity verification consent is required',
  }),
  third_party_sharing: z.boolean(),
  consent_version: z.string().default('1.0'),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;
