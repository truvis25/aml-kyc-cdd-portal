import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { insertConsentRecord, getLatestConsent } from './consent.repository';
import type { CaptureConsentParams, ConsentRecord } from './consent.types';

export async function captureConsent(
  params: CaptureConsentParams,
  actorId: string
): Promise<ConsentRecord> {
  const record = await insertConsentRecord(params);

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.CONSENT_CAPTURED,
    entity_type: AuditEntityType.CONSENT,
    entity_id: record.id,
    actor_id: actorId,
    payload: {
      customer_id: params.customer_id,
      consent_version: record.consent_version,
      purposes: {
        data_processing: params.data_processing,
        aml_screening: params.aml_screening,
        identity_verification: params.identity_verification,
        third_party_sharing: params.third_party_sharing,
      },
    },
  });

  return record;
}

export async function getConsentStatus(
  customer_id: string,
  tenant_id: string
): Promise<{ has_consent: boolean; record: ConsentRecord | null }> {
  const record = await getLatestConsent(customer_id, tenant_id);
  return {
    has_consent: record !== null && record.data_processing && record.aml_screening && record.identity_verification,
    record,
  };
}
