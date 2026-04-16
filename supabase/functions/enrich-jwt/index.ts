/**
 * enrich-jwt — Supabase Auth Hook (Edge Function)
 *
 * Purpose: Adds custom claims to the JWT after successful authentication.
 * Claims added: tenant_id, role, mfa_verified, permissions[]
 *
 * These claims are read by:
 * - RLS policies: auth.jwt() ->> 'tenant_id'
 * - Edge Middleware: JWT claim inspection (no DB calls)
 * - API route handlers: auth context
 *
 * Source: DevPlan v1.0 Section 4.1 — JWT Custom Claims
 * Source: DevPlan v1.0 Section 7.1 — Supabase Auth Hook
 *
 * SECURITY:
 * - Uses service role key (available as built-in Deno secret in Edge Functions)
 * - If user has no active role in user_roles, JWT claims are empty → access denied
 * - Fail closed: missing claims → re-authentication required (enforced by middleware)
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
