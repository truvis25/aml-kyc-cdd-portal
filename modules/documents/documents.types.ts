export type DocumentType =
  | 'passport'
  | 'national_id'
  | 'residence_permit'
  | 'driving_licence'
  | 'proof_of_address'
  | 'bank_statement'
  | 'utility_bill'
  | 'other';

export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';

export interface Document {
  id: string;
  tenant_id: string;
  customer_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  file_hash: string | null;
  status: DocumentStatus;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface CreateDocumentParams {
  tenant_id: string;
  customer_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
}

export interface SignedUploadUrl {
  document_id: string;
  upload_url: string;
  storage_path: string;
  expires_at: string;
}

export interface SignedDownloadUrl {
  document_id: string;
  download_url: string;
  expires_at: string;
}
