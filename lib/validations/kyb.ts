import { z } from 'zod';
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const KybBusinessSchema = z.object({
  company_name:             z.string().min(2).max(300),
  trade_license_number:     z.string().min(2).max(100),
  jurisdiction:             z.string().min(2).max(100),
  activity_type:            z.enum(ACTIVITY_TYPES),
  trade_license_issued_at:  isoDate,
  trade_license_expires_at: isoDate,
  authorized_rep_name:      z.string().min(2).max(200),
});

export type KybBusinessInput = z.infer<typeof KybBusinessSchema>;
