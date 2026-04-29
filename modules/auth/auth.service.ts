import { createClient } from '@/lib/supabase/server';
import type { AuthContext, AuthUser } from '@/modules/auth/auth.types';
import type { Role } from '@/lib/constants/roles';

/**
 * Get the authenticated user's context from the current request.
 * Returns null if the user is not authenticated.
 *
 * Used in Server Components and API Route Handlers.
 * Falls back to a DB lookup when JWT claims are not yet populated
 * (e.g. during token-refresh windows before the custom_access_token_hook fires).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = (claimsData?.claims ?? {}) as Record<string, unknown>;
  let tenantId = claims?.tenant_id as string | undefined;
  let userRole = claims?.user_role as Role | undefined;
  const mfaVerified = claims?.aal === 'aal2';

  // Fallback: if JWT claims are missing (token refresh window), read from DB
  if (!tenantId || !userRole) {
    const { data: userRow } = await supabase
      .from('users')
      .select('tenant_id, user_roles(roles(name))')
      .eq('id', user.id)
      .single();

    if (!userRow) return null;

    tenantId = (userRow as { tenant_id: string }).tenant_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleRows = (userRow as any).user_roles;
    userRole = Array.isArray(roleRows) && roleRows.length > 0
      ? (roleRows[0]?.roles?.name as Role)
      : undefined;

    if (!tenantId || !userRole) return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    tenant_id: tenantId,
    role: userRole,
    mfa_verified: mfaVerified,
    display_name: null,
    email: user.email ?? '',
  };

  return {
    user: authUser,
    claims: {
      sub: user.id,
      email: user.email,
      tenant_id: tenantId,
      user_role: userRole,
      mfa_verified: mfaVerified,
      permissions: (claims?.permissions as string[]) ?? [],
    },
  };
}

/**
 * Get the authenticated user or throw a 401 response.
 * Use in API Route Handlers that require authentication.
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return ctx;
}

/**
 * Check if tenant has an active billing status.
 * Returns true if active, false if trialing/past_due/canceled.
 * Throws if billing record doesn't exist.
 */
export async function requireActiveBilling(tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: billing, error } = await supabase
    .from('tenant_billing')
    .select('status, trial_ends_at')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    throw new Response(
      JSON.stringify({ error: 'Billing information not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Allow 'trialing' status as long as trial hasn't expired
  if (billing.status === 'trialing') {
    const now = new Date();
    const typedBilling = billing as { status: string; trial_ends_at: string };
    const trialEndsAt = new Date(typedBilling.trial_ends_at);
    if (now < trialEndsAt) {
      return true;
    }
  }

  // Only 'active' status allows onboarding
  if (billing.status !== 'active') {
    throw new Response(
      JSON.stringify({
        error: 'Subscription inactive. Please complete payment or upgrade.',
        status: billing.status,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return true;
}
