import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import type { KybBusinessInput } from '@/lib/validations/kyb';
import type { Business, BusinessDataVersion } from './kyb.types';
import {
  createBusiness,
  appendBusinessData,
  getBusinessById,
  getLatestBusinessData,
  updateBusinessStatus,
} from './kyb.repository';

export async function initiateBusiness(
  tenant_id: string,
  customer_id: string,
  actor_id: string
): Promise<Business> {
  const business = await createBusiness(tenant_id, customer_id);

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.KYB_INITIATED,
    entity_type: AuditEntityType.BUSINESS,
    entity_id: business.id,
    actor_id,
    payload: { customer_id },
  });

  return business;
}

export async function submitBusinessData(
  business_id: string,
  tenant_id: string,
  fields: KybBusinessInput,
  actor_id: string
): Promise<BusinessDataVersion> {
  const version = await appendBusinessData(business_id, tenant_id, fields, actor_id);

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.BUSINESS_FIELD_CHANGED,
    entity_type: AuditEntityType.BUSINESS,
    entity_id: business_id,
    actor_id,
    payload: { version: version.version },
  });

  return version;
}

export async function getBusiness(
  business_id: string,
  tenant_id: string
): Promise<{ business: Business; latest_data: BusinessDataVersion | null }> {
  const business = await getBusinessById(business_id, tenant_id);
  if (!business) throw new Error(`Business not found: ${business_id}`);

  const latest_data = await getLatestBusinessData(business_id, tenant_id);
  return { business, latest_data };
}

export { updateBusinessStatus };
