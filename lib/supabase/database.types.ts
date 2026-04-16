/**
 * Supabase Database type stubs.
 * Replace with generated types after running: supabase gen types typescript
 * Command: npx supabase gen types typescript --local > lib/supabase/database.types.ts
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
        Update: Record<string, never>; // No updates allowed on audit_log
        Relationships: [
          {
            foreignKeyName: 'audit_log_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
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
