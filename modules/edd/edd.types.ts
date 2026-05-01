/**
 * Enhanced Due Diligence (EDD) — types.
 * PRD v1.0 §M-06.
 *
 * EDD records are append-only and versioned per customer. They are
 * visible only to roles holding `customers:read_edd_data` (mlro,
 * senior_reviewer, tenant_admin). See supabase/migrations/0038.
 */

export interface EddRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  version: number;
  source_of_wealth_narrative: string;
  source_of_funds_narrative: string;
  expected_annual_volume_aed: number | null;
  expected_currencies: string[];
  expected_counterparties: string | null;
  expected_payment_methods: string[];
  pep_relationship_details: string | null;
  supporting_document_ids: string[];
  reviewer_rationale: string | null;
  submitted_by: string;
  submitted_at: string;
}

export interface CreateEddRecordParams {
  tenant_id: string;
  customer_id: string;
  source_of_wealth_narrative: string;
  source_of_funds_narrative: string;
  expected_annual_volume_aed: number | null;
  expected_currencies: string[];
  expected_counterparties: string | null;
  expected_payment_methods: string[];
  pep_relationship_details: string | null;
  supporting_document_ids: string[];
  reviewer_rationale: string | null;
  submitted_by: string;
  actor_role: string;
}
