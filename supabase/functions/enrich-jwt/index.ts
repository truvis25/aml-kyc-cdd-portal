/**
 * enrich-jwt — RETIRED (Decision C-02, 2026-04-16)
 *
 * This Edge Function approach has been superseded by a Postgres Function
 * Custom Access Token Hook (decision C-02).
 *
 * The active JWT enrichment implementation is now in:
 *   supabase/migrations/0005_jwt_custom_access_token_hook.sql
 *   Function: custom_access_token_hook(event jsonb)
 *
 * Registration: Supabase Dashboard → Authentication → Hooks
 *               → Custom Access Token Hook → custom_access_token_hook
 *
 * This file is retained for reference only. DO NOT deploy or register it.
 * It will be removed in a future cleanup milestone.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Role names that require MFA to be verified before granting access
const MFA_REQUIRED_ROLES = ['platform_super_admin', 'tenant_admin', 'mlro'];

// Permission map per role — mirrors modules/auth/rbac.ts
const ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_super_admin: [
    'admin:view_all_tenants',
    'admin:manage_config',
    'audit:read',
    'audit:export',
  ],
  tenant_admin: [
    'admin:manage_users',
    'admin:manage_config',
    'admin:activate_workflow',
    'cases:read_all',
    'customers:read_all',
    'documents:read',
    'screening:read',
    'risk:read',
    'audit:read',
    'audit:export',
    'reporting:read_aggregate',
  ],
  mlro: [
    'cases:read_all',
    'cases:read_high_risk',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    'cases:approve_standard',
    'cases:approve_high_risk',
    'cases:reject',
    'cases:view_sar_status',
    'customers:read_all',
    'customers:read_edd_data',
    'documents:read',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
    'risk:configure',
    'audit:read',
    'audit:export',
    'reporting:read_aggregate',
  ],
  senior_reviewer: [
    'cases:read_assigned',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    'cases:approve_standard',
    'cases:approve_high_risk',
    'cases:reject',
    'customers:read_assigned',
    'customers:read_edd_data',
    'documents:read',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
    'reporting:read_aggregate',
  ],
  analyst: [
    'cases:read_assigned',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    'cases:approve_standard',
    'cases:reject',
    'customers:read_assigned',
    'documents:read',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
  ],
  onboarding_agent: [
    'onboarding:initiate',
    'onboarding:assist_customer',
    'documents:upload',
  ],
  read_only: [
    'reporting:read_aggregate',
  ],
};

interface AuthHookPayload {
  user_id: string;
  event?: string;
}

interface UserRoleRow {
  tenant_id: string;
  role_name: string;
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json() as AuthHookPayload;
    const userId = body.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the user's active role assignment
    const { data: userRoleData, error: roleError } = await adminClient
      .from('user_roles')
      .select(`
        tenant_id,
        roles!inner(name)
      `)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .limit(1)
      .single();

    if (roleError || !userRoleData) {
      // User has no active role — return empty claims
      // Middleware will detect missing claims and block access
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const roleRow = userRoleData as unknown as UserRoleRow;
    const roleName = roleRow.role_name;
    const tenantId = roleRow.tenant_id;

    // Check MFA status from users table
    const { data: userData } = await adminClient
      .from('users')
      .select('mfa_enabled')
      .eq('id', userId)
      .single();

    const mfaVerified = Boolean(userData?.mfa_enabled);
    const permissions = ROLE_PERMISSIONS[roleName] ?? [];

    // Return custom claims to be added to JWT
    const claims = {
      tenant_id: tenantId,
      role: roleName,
      mfa_verified: mfaVerified,
      permissions,
    };

    return new Response(JSON.stringify(claims), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('enrich-jwt error:', err instanceof Error ? err.message : 'Unknown error');
    // Return empty claims on error — middleware will block access (fail closed)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
