/**
 * Supabase Database types — manually maintained to match migrations 0001–0016.
 * Regenerate with: npx supabase gen types typescript --local > lib/supabase/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          status: 'active' | 'suspended' | 'inactive';
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          status?: 'active' | 'suspended' | 'inactive';
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          status?: 'active' | 'suspended' | 'inactive';
          settings?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          display_name: string | null;
          mfa_enabled: boolean;
          status: 'active' | 'suspended' | 'deactivated';
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          display_name?: string | null;
          mfa_enabled?: boolean;
          status?: 'active' | 'suspended' | 'deactivated';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          display_name?: string | null;
          mfa_enabled?: boolean;
          status?: 'active' | 'suspended' | 'deactivated';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          role_id: string;
          granted_at: string;
          granted_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          role_id: string;
          granted_at?: string;
          granted_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          role_id?: string;
          granted_at?: string;
          granted_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      audit_log: {
        Row: {
          id: string;
          tenant_id: string;
          event_time: string;
          event_type: string;
          actor_id: string | null;
          actor_role: string | null;
          entity_type: string;
          entity_id: string;
          payload: Json;
          session_id: string | null;
          ip_address: string | null;
          prev_hash: string | null;
          row_hash: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          event_time?: string;
          event_type: string;
          actor_id?: string | null;
          actor_role?: string | null;
          entity_type: string;
          entity_id: string;
          payload?: Json;
          session_id?: string | null;
          ip_address?: string | null;
          prev_hash?: string | null;
          row_hash?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'audit_log_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          customer_type: 'individual' | 'corporate';
          status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'suspended';
          latest_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_type?: 'individual' | 'corporate';
          status?: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'suspended';
          latest_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_type?: 'individual' | 'corporate';
          status?: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'suspended';
          latest_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_data_versions: {
        Row: {
          id: string;
          customer_id: string;
          tenant_id: string;
          version: number;
          full_name: string | null;
          date_of_birth: string | null;
          nationality: string | null;
          country_of_residence: string | null;
          id_type: 'passport' | 'national_id' | 'residence_permit' | 'driving_licence' | null;
          id_number: string | null;
          id_expiry: string | null;
          id_issuing_country: string | null;
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
          submitted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          tenant_id: string;
          version: number;
          full_name?: string | null;
          date_of_birth?: string | null;
          nationality?: string | null;
          country_of_residence?: string | null;
          id_type?: 'passport' | 'national_id' | 'residence_permit' | 'driving_licence' | null;
          id_number?: string | null;
          id_expiry?: string | null;
          id_issuing_country?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          occupation?: string | null;
          employer?: string | null;
          pep_status?: boolean;
          pep_details?: string | null;
          dual_nationality?: string | null;
          source_of_funds?: string | null;
          purpose_of_relationship?: string | null;
          submitted_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'customer_data_versions_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_data_versions_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          document_type: 'passport' | 'national_id' | 'residence_permit' | 'driving_licence' | 'proof_of_address' | 'bank_statement' | 'utility_bill' | 'other';
          storage_path: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          file_hash: string | null;
          status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          document_type: 'passport' | 'national_id' | 'residence_permit' | 'driving_licence' | 'proof_of_address' | 'bank_statement' | 'utility_bill' | 'other';
          storage_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          file_hash?: string | null;
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          document_type?: 'passport' | 'national_id' | 'residence_permit' | 'driving_licence' | 'proof_of_address' | 'bank_statement' | 'utility_bill' | 'other';
          storage_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          file_hash?: string | null;
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      document_events: {
        Row: {
          id: string;
          document_id: string;
          tenant_id: string;
          event_type: string;
          actor_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          tenant_id: string;
          event_type: string;
          actor_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'document_events_document_id_fkey';
            columns: ['document_id'];
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_events_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      consent_records: {
        Row: {
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
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          data_processing?: boolean;
          aml_screening?: boolean;
          identity_verification?: boolean;
          third_party_sharing?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          consent_version?: string;
          captured_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'consent_records_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consent_records_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      onboarding_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          workflow_id: string | null;
          status: 'in_progress' | 'paused' | 'submitted' | 'approved' | 'rejected' | 'expired';
          current_step: string;
          completed_steps: string[];
          step_data: Json;
          token: string | null;
          token_expires_at: string | null;
          started_at: string;
          last_activity_at: string;
          submitted_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          workflow_id?: string | null;
          status?: 'in_progress' | 'paused' | 'submitted' | 'approved' | 'rejected' | 'expired';
          current_step?: string;
          completed_steps?: string[];
          step_data?: Json;
          token?: string | null;
          token_expires_at?: string | null;
          started_at?: string;
          last_activity_at?: string;
          submitted_at?: string | null;
          expires_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          workflow_id?: string | null;
          status?: 'in_progress' | 'paused' | 'submitted' | 'approved' | 'rejected' | 'expired';
          current_step?: string;
          completed_steps?: string[];
          step_data?: Json;
          token?: string | null;
          token_expires_at?: string | null;
          started_at?: string;
          last_activity_at?: string;
          submitted_at?: string | null;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'onboarding_sessions_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'onboarding_sessions_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'onboarding_sessions_workflow_id_fkey';
            columns: ['workflow_id'];
            referencedRelation: 'workflow_definitions';
            referencedColumns: ['id'];
          }
        ];
      };
      workflow_definitions: {
        Row: {
          id: string;
          tenant_id: string | null;
          name: string;
          customer_type: 'individual' | 'corporate';
          version: number;
          definition: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          name: string;
          customer_type?: 'individual' | 'corporate';
          version?: number;
          definition: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          name?: string;
          customer_type?: 'individual' | 'corporate';
          version?: number;
          definition?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_definitions_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          provider: string;
          event_type: string;
          payload: Json;
          signature: string | null;
          status: 'pending' | 'processing' | 'processed' | 'failed' | 'dead_letter';
          attempts: number;
          last_error: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          provider: string;
          event_type: string;
          payload?: Json;
          signature?: string | null;
          status?: 'pending' | 'processing' | 'processed' | 'failed' | 'dead_letter';
          attempts?: number;
          last_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          provider?: string;
          event_type?: string;
          payload?: Json;
          signature?: string | null;
          status?: 'pending' | 'processing' | 'processed' | 'failed' | 'dead_letter';
          attempts?: number;
          last_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_events_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      screening_jobs: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          provider: string;
          external_job_id: string | null;
          search_type: 'individual' | 'corporate';
          status: 'pending' | 'running' | 'completed' | 'failed';
          requested_by: string | null;
          requested_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          provider?: string;
          external_job_id?: string | null;
          search_type?: 'individual' | 'corporate';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          requested_by?: string | null;
          requested_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          provider?: string;
          external_job_id?: string | null;
          search_type?: 'individual' | 'corporate';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          requested_by?: string | null;
          requested_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'screening_jobs_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screening_jobs_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      screening_hits: {
        Row: {
          id: string;
          tenant_id: string;
          job_id: string;
          customer_id: string;
          hit_type: string;
          match_name: string;
          match_score: number | null;
          raw_data: Json;
          status: 'pending' | 'confirmed_match' | 'false_positive' | 'escalated';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          job_id: string;
          customer_id: string;
          hit_type: string;
          match_name: string;
          match_score?: number | null;
          raw_data?: Json;
          status?: 'pending' | 'confirmed_match' | 'false_positive' | 'escalated';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          job_id?: string;
          customer_id?: string;
          hit_type?: string;
          match_name?: string;
          match_score?: number | null;
          raw_data?: Json;
          status?: 'pending' | 'confirmed_match' | 'false_positive' | 'escalated';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'screening_hits_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screening_hits_job_id_fkey';
            columns: ['job_id'];
            referencedRelation: 'screening_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screening_hits_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      screening_hit_resolutions: {
        Row: {
          id: string;
          tenant_id: string;
          hit_id: string;
          resolution: 'confirmed_match' | 'false_positive' | 'escalated';
          rationale: string;
          resolved_by: string;
          resolved_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          hit_id: string;
          resolution: 'confirmed_match' | 'false_positive' | 'escalated';
          rationale: string;
          resolved_by: string;
          resolved_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'screening_hit_resolutions_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screening_hit_resolutions_hit_id_fkey';
            columns: ['hit_id'];
            referencedRelation: 'screening_hits';
            referencedColumns: ['id'];
          }
        ];
      };
      risk_assessments: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          composite_score: number;
          risk_band: 'low' | 'medium' | 'high' | 'unacceptable';
          customer_score: number | null;
          geographic_score: number | null;
          product_score: number | null;
          factor_breakdown: Json;
          version: number;
          assessed_at: string;
          assessed_by: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          composite_score: number;
          risk_band: 'low' | 'medium' | 'high' | 'unacceptable';
          customer_score?: number | null;
          geographic_score?: number | null;
          product_score?: number | null;
          factor_breakdown?: Json;
          version?: number;
          assessed_at?: string;
          assessed_by?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'risk_assessments_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'risk_assessments_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      cases: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          session_id: string | null;
          risk_assessment_id: string | null;
          queue: 'standard' | 'edd' | 'escalation' | 'senior';
          status: 'open' | 'in_review' | 'pending_info' | 'escalated' | 'approved' | 'rejected' | 'closed';
          assigned_to: string | null;
          sar_flagged: boolean;
          opened_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          session_id?: string | null;
          risk_assessment_id?: string | null;
          queue?: 'standard' | 'edd' | 'escalation' | 'senior';
          status?: 'open' | 'in_review' | 'pending_info' | 'escalated' | 'approved' | 'rejected' | 'closed';
          assigned_to?: string | null;
          sar_flagged?: boolean;
          opened_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          session_id?: string | null;
          risk_assessment_id?: string | null;
          queue?: 'standard' | 'edd' | 'escalation' | 'senior';
          status?: 'open' | 'in_review' | 'pending_info' | 'escalated' | 'approved' | 'rejected' | 'closed';
          assigned_to?: string | null;
          sar_flagged?: boolean;
          opened_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cases_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cases_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cases_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'onboarding_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cases_risk_assessment_id_fkey';
            columns: ['risk_assessment_id'];
            referencedRelation: 'risk_assessments';
            referencedColumns: ['id'];
          }
        ];
      };
      case_events: {
        Row: {
          id: string;
          tenant_id: string;
          case_id: string;
          event_type: string;
          actor_id: string | null;
          actor_role: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          case_id: string;
          event_type: string;
          actor_id?: string | null;
          actor_role?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'case_events_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_events_case_id_fkey';
            columns: ['case_id'];
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          }
        ];
      };
      approvals: {
        Row: {
          id: string;
          tenant_id: string;
          case_id: string;
          decision: 'approved' | 'rejected';
          rationale: string;
          decided_by: string;
          decided_at: string;
          requires_second_approval: boolean;
          second_approver: string | null;
          second_decided_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          case_id: string;
          decision: 'approved' | 'rejected';
          rationale: string;
          decided_by: string;
          decided_at?: string;
          requires_second_approval?: boolean;
          second_approver?: string | null;
          second_decided_at?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'approvals_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'approvals_case_id_fkey';
            columns: ['case_id'];
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
