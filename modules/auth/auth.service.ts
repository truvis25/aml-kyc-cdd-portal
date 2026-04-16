import { createClient } from '@/lib/supabase/server';
import type { AuthContext, AuthUser } from '@/modules/auth/auth.types';
import type { Role } from '@/lib/constants/roles';

/**
 * Get the authenticated user's context from the current request.
 * Returns null if the user is not authenticated.
 *
 * Used in Server Components and API Route Handlers.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const claims = user.app_metadata as Record<string, unknown>;
  const tenantId = claims?.tenant_id as string | undefined;
  const role = claims?.role as Role | undefined;
  const mfaVerified = Boolean(claims?.mfa_verified);

  if (!tenantId || !role) return null;

  const authUser: AuthUser = {
    id: user.id,
    tenant_id: tenantId,
    role,
    mfa_verified: mfaVerified,
    display_name: null, // populated from users table when needed
    email: user.email ?? '',
  };

  return {
    user: authUser,
    claims: {
      sub: user.id,
      email: user.email,
      tenant_id: tenantId,
      role,
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
