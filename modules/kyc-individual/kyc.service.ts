import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import {
  createCustomer,
  getCustomerById,
  appendCustomerData,
  getLatestCustomerData,
  updateCustomerStatus,
} from './kyc.repository';
import type { Customer, CustomerDataVersion } from './kyc.types';
import type { KycIdentityInput } from '@/lib/validations/kyc';

export async function initiateCustomer(
  tenant_id: string,
  actor_id: string
): Promise<Customer> {
  const customer = await createCustomer(tenant_id, 'individual');

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.KYC_INITIATED,
    entity_type: AuditEntityType.CUSTOMER,
    entity_id: customer.id,
    actor_id,
    payload: { customer_type: 'individual' },
  });

  return customer;
}

export async function submitIdentityData(
  customer_id: string,
  tenant_id: string,
  fields: KycIdentityInput,
  actor_id: string
): Promise<CustomerDataVersion> {
  const customer = await getCustomerById(customer_id, tenant_id);
  if (!customer) throw new Error('Customer not found');

  const version = await appendCustomerData(customer_id, tenant_id, fields, actor_id);

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.CUSTOMER_FIELD_CHANGED,
    entity_type: AuditEntityType.CUSTOMER,
    entity_id: customer_id,
    actor_id,
    payload: {
      version: version.version,
      pep_status: fields.pep_status,
    },
  });

  return version;
}

export async function getCustomer(
  customer_id: string,
  tenant_id: string
): Promise<{ customer: Customer; latest_data: CustomerDataVersion | null }> {
  const customer = await getCustomerById(customer_id, tenant_id);
  if (!customer) throw new Error('Customer not found');

  const latest_data = await getLatestCustomerData(customer_id, tenant_id);
  return { customer, latest_data };
}

export async function markSubmitted(
  customer_id: string,
  tenant_id: string,
  actor_id: string
): Promise<void> {
  await updateCustomerStatus(customer_id, tenant_id, 'submitted');

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.SESSION_COMPLETED,
    entity_type: AuditEntityType.CUSTOMER,
    entity_id: customer_id,
    actor_id,
    payload: {},
  });
}
