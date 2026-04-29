/**
 * SAR (Suspicious Activity Report) types and Zod schemas.
 *
 * Schemas mirror the `sar_reports` table (migration 0036) and act as the
 * input validators on every API surface. The goAML XML builder consumes
 * `SarReport` directly, so any field added here must round-trip through
 * the builder and back.
 */

import { z } from 'zod';

/** goAML reason codes per FATF/UAE FIU guidance. Extend as the regulator publishes new codes. */
export const REASON_CODES = ['UNK', 'STR', 'CTR', 'TFS', 'EFT', 'CASH'] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

/** SAR lifecycle states. */
export const SAR_STATUSES = ['draft', 'ready', 'submitted', 'acknowledged', 'rejected'] as const;
export type SarStatus = (typeof SAR_STATUSES)[number];

/** Instrument types per goAML. Mapped to the FROM_INSTRUMENT element in the XML. */
export const INSTRUMENT_TYPES = [
  'cash',
  'wire',
  'cheque',
  'card',
  'crypto',
  'other',
] as const;
export type InstrumentType = (typeof INSTRUMENT_TYPES)[number];

export const SarTransactionSchema = z.object({
  date: z.string().datetime({ offset: true }),
  amount_aed: z.number().nonnegative(),
  instrument_type: z.enum(INSTRUMENT_TYPES),
  counterparty: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
  reference: z.string().trim().max(120).optional(),
});
export type SarTransaction = z.infer<typeof SarTransactionSchema>;

export const CreateSarDraftSchema = z.object({
  case_id: z.string().uuid(),
  reason_codes: z.array(z.enum(REASON_CODES)).min(1, 'Select at least one reason code'),
  narrative: z.string().trim().min(20, 'Narrative must be at least 20 characters').max(50000),
  activity_start: z.string().datetime({ offset: true }).optional(),
  activity_end: z.string().datetime({ offset: true }).optional(),
  transactions: z.array(SarTransactionSchema).default([]),
});
export type CreateSarDraftInput = z.infer<typeof CreateSarDraftSchema>;

export const UpdateSarDraftSchema = z.object({
  reason_codes: z.array(z.enum(REASON_CODES)).min(1).optional(),
  narrative: z.string().trim().min(20).max(50000).optional(),
  activity_start: z.string().datetime({ offset: true }).nullable().optional(),
  activity_end: z.string().datetime({ offset: true }).nullable().optional(),
  transactions: z.array(SarTransactionSchema).optional(),
  status: z.enum(SAR_STATUSES).optional(),
});
export type UpdateSarDraftInput = z.infer<typeof UpdateSarDraftSchema>;

/** Full record as returned by the service / queried from `sar_reports`. */
export interface SarReport {
  id: string;
  tenant_id: string;
  case_id: string;
  customer_id: string;
  reference_number: string;
  status: SarStatus;
  reason_codes: ReasonCode[];
  narrative: string;
  activity_start: string | null;
  activity_end: string | null;
  total_amount_aed: number;
  transactions: SarTransaction[];
  goaml_xml_hash: string | null;
  goaml_xml_version: number;
  goaml_submission_id: string | null;
  regulator_acknowledgment: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
}

/** Reporting institution metadata, sourced from tenant_config. */
export interface ReportingInstitution {
  name: string;
  /** UAE FIU-issued reporting entity ID (a.k.a. "Org ID"). */
  reporting_entity_id?: string;
  contact_email?: string;
  contact_phone?: string;
}

/** Subject (the customer being reported). */
export interface SarSubject {
  full_name: string;
  date_of_birth?: string | null;
  nationality?: string | null;
  id_number?: string | null;
  id_type?: string | null;
  address?: string | null;
}
