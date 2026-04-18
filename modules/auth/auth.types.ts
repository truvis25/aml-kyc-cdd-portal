import type { Role } from '@/lib/constants/roles';

/**
 * JWT custom claims added by the custom_access_token_hook Postgres function
 * These claims are available via auth.jwt() in RLS policies
 */
export interface JwtClaims {
  tenant_id: string;
  role: Role;
  mfa_verified: boolean;
  permissions: string[];
  // Standard JWT claims
  sub: string; // user ID
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * User record from the users table + JWT claims
 */
export interface AuthUser {
  id: string;
  tenant_id: string;
  role: Role;
  mfa_verified: boolean;
  display_name: string | null;
  email: string;
}

/**
 * Result of parsing a request's auth context
 */
export interface AuthContext {
  user: AuthUser;
  claims: JwtClaims;
}
