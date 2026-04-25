import type { ActivityType } from '@/lib/constants/activity-types';

export type BusinessStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'suspended';

export interface Business {
  id: string;
  tenant_id: string;
  customer_id: string;
  latest_version: number;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessDataVersion {
  id: string;
  business_id: string;
  tenant_id: string;
  version: number;
  company_name: string | null;
  trade_license_number: string | null;
  jurisdiction: string | null;
  activity_type: ActivityType | null;
  trade_license_issued_at: string | null;
  trade_license_expires_at: string | null;
  authorized_rep_name: string | null;
  changed_by: string | null;
  created_at: string;
}
