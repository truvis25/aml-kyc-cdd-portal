import { z } from 'zod';

export const ConsentSchema = z.object({
  customer_id: z.string().uuid(),
  data_processing: z.literal(true, {
    errorMap: () => ({ message: 'Data processing consent is required' }),
  }),
  aml_screening: z.literal(true, {
    errorMap: () => ({ message: 'AML screening consent is required' }),
  }),
  identity_verification: z.literal(true, {
    errorMap: () => ({ message: 'Identity verification consent is required' }),
  }),
  third_party_sharing: z.boolean(),
  consent_version: z.string().default('1.0'),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;
