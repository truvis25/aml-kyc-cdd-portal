import { z } from 'zod';

export const DocumentTypeSchema = z.enum([
  'passport',
  'national_id',
  'residence_permit',
  'driving_licence',
  'proof_of_address',
  'bank_statement',
  'utility_bill',
  'other',
  'emirates_id_front',
  'emirates_id_back',
  'trade_license',
]);

export const UploadUrlRequestSchema = z.object({
  customer_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().positive().max(20 * 1024 * 1024), // 20 MB max
  mime_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]),
});

export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
