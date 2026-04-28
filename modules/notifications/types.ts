export type NotificationTemplate = 'rai' | 'approval' | 'rejection';
export type NotificationChannel = 'email' | 'sms';

export interface RaiVars {
  tenantName: string;
  customerName: string;
  infoRequested: string;
  documentsRequired?: string[];
  statusUrl: string;
}

export interface DecisionVars {
  tenantName: string;
  customerName: string;
  statusUrl: string;
  rationaleSummary?: string;
}

export interface SendResult {
  ok: boolean;
  providerMessageId: string | null;
  error?: string;
}
