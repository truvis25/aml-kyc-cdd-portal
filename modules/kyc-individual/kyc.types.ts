export interface Customer {
  id: string;
  tenant_id: string;
  customer_type: 'individual' | 'corporate';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'suspended';
  latest_version: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerDataVersion {
  id: string;
  customer_id: string;
  tenant_id: string;
  version: number;
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  id_type: string | null;
  id_number: string | null;
  id_expiry: string | null;
  id_issuing_country: string | null;
  emirates_id_number: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  occupation: string | null;
  employer: string | null;
  pep_status: boolean;
  pep_details: string | null;
  dual_nationality: string | null;
  source_of_funds: string | null;
  purpose_of_relationship: string | null;
  bank_account: {
    iban: string | null;
    bank_name: string | null;
    account_number: string | null;
    swift_code: string | null;
  } | null;
  submitted_by: string | null;
  created_at: string;
}
