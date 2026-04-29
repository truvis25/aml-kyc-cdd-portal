import { z } from 'zod';

// Treat empty strings as "not provided" — the form sends "" for unfilled
// optional fields and we want them stored as NULL, not "".
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const MarketingLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(320),
  company: optionalText(200),
  role: optionalText(100),
  vertical: z.enum(['dnfbp', 'fintech', 'bank', 'other']).optional(),
  message: optionalText(2000),
  source_path: optionalText(500),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  // Honeypot — bots fill it, humans don't. Server rejects any non-empty value.
  website: z.string().max(0).optional(),
});

export type MarketingLeadInput = z.infer<typeof MarketingLeadSchema>;
