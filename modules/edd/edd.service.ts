import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import { createClient } from '@/lib/supabase/server';
import { getLatestEddRecord, insertEddRecord, listEddRecordHistory } from './edd.repository';
import type { CreateEddRecordParams, EddRecord } from './edd.types';

export { getLatestEddRecord, listEddRecordHistory };

/**
 * Validates that every supporting_document_id belongs to the same customer
 * + tenant. Prevents a privileged actor from referencing another tenant's
 * documents in an EDD record. RLS already prevents cross-tenant reads, but
 * we want a hard fail with a clear error rather than silent fan-out.
 */
async function assertDocumentsBelongToCustomer(
  documentIds: string[],
  customerId: string,
  tenantId: string,
): Promise<void> {
  if (documentIds.length === 0) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('id, customer_id, tenant_id')
    .in('id', documentIds);
  if (error) {
    throw new Error(`Failed to validate supporting documents: ${error.message}`);
  }
  const rows = (data ?? []) as Array<{ id: string; customer_id: string; tenant_id: string }>;
  if (rows.length !== documentIds.length) {
    throw new Error('One or more supporting_document_ids could not be found.');
  }
  for (const row of rows) {
    if (row.tenant_id !== tenantId || row.customer_id !== customerId) {
      throw new Error(
        `Document ${row.id} does not belong to this customer; refusing to attach.`,
      );
    }
  }
}

/**
 * Records a new EDD entry for the customer. Append-only — every call
 * creates a new version row.
 *
 * Caller must already have asserted the `customers:read_edd_data`
 * permission via assertPermission(...) at the API boundary.
 */
export async function recordEdd(params: CreateEddRecordParams): Promise<EddRecord> {
  await assertDocumentsBelongToCustomer(
    params.supporting_document_ids,
    params.customer_id,
    params.tenant_id,
  );

  const record = await insertEddRecord({
    tenant_id: params.tenant_id,
    customer_id: params.customer_id,
    source_of_wealth_narrative: params.source_of_wealth_narrative,
    source_of_funds_narrative: params.source_of_funds_narrative,
    expected_annual_volume_aed: params.expected_annual_volume_aed,
    expected_currencies: params.expected_currencies,
    expected_counterparties: params.expected_counterparties,
    expected_payment_methods: params.expected_payment_methods,
    pep_relationship_details: params.pep_relationship_details,
    supporting_document_ids: params.supporting_document_ids,
    reviewer_rationale: params.reviewer_rationale,
    submitted_by: params.submitted_by,
  });

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.EDD_RECORDED,
    entity_type: AuditEntityType.EDD_RECORD,
    entity_id: record.id,
    actor_id: params.submitted_by,
    actor_role: params.actor_role,
    payload: {
      customer_id: params.customer_id,
      version: record.version,
      supporting_document_count: params.supporting_document_ids.length,
      has_pep_details: params.pep_relationship_details !== null,
      has_reviewer_rationale: params.reviewer_rationale !== null,
    },
  });

  return record;
}
