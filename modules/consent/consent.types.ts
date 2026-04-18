export interface ConsentRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  data_processing: boolean;
  aml_screening: boolean;
  identity_verification: boolean;
  third_party_sharing: boolean;
  ip_address: string | null;
  user_agent: string | null;
  consent_version: string;
  captured_at: string;
}

export interface CaptureConsentParams {
  tenant_id: string;
  customer_id: string;
  data_processing: boolean;
  aml_screening: boolean;
  identity_verification: boolean;
  third_party_sharing: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  consent_version?: string;
}
