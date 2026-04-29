import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Role, MFA_REQUIRED_ROLES } from '@/lib/constants/roles';
import { getSupabasePublicEnv, SupabaseEnvError } from '@/lib/supabase/env';

/**
 * Edge Middleware — Auth Guard, Tenant Resolution, MFA Check
 *
 * Responsibilities:
 * 1. Refresh Supabase session (keep JWT fresh)
 * 2. Protect authenticated routes — redirect unauthenticated users to /sign-in
 * 3. Enforce role-based access to specific sections
 * 4. Enforce MFA for roles that require it (role-based, not path-based)
 * 5. Validate tenant context matches JWT claims
 *
 * DevPlan v1.0 Section 2.2 — Edge Middleware
 * IMPORTANT: No DB calls in middleware — rely only on signed JWT claims.
 */

// Routes accessible without authentication
const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/auth/confirm',
  '/mfa-setup',
  '/forgot-password',
  '/reset-password',
];

// Public marketing surface — landing site, comparison pages, pricing, legal,
// and the lead-capture API. These routes never require authentication.
const MARKETING_PATH_PREFIXES = [
  '/product',
  '/security',
  '/pricing',
  '/compare',
  '/for',
  '/legal',
  '/book-demo',
  '/api/lead',
];

// Routes requiring specific roles
const ADMIN_ONLY_PATHS = ['/admin'];
const MLRO_PATHS = ['/audit'];

export async function proxy(request: NextRequest) {
  return middleware(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // Marketing site: the landing page is exactly '/'; the rest are prefix matches.
  const isMarketingPath =
    pathname === '/' ||
    MARKETING_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Allow onboarding routes (customer-facing, uses session-based auth not staff JWT)
  // Pattern: /{tenantSlug}/onboard/...
  const isOnboardingPath = /^\/[^/]+\/onboard/.test(pathname);
  // Allow API routes that are webhook receivers (no JWT required — validated by signature)
  const isWebhookPath = pathname.startsWith('/api/webhooks/');
  // Liveness probe — public, no PII, no tenant state. Used by external
  // monitors and the on-call runbook (docs/RUNBOOK.md §2.1).
  const isHealthPath = pathname === '/api/health';

  if (isPublicPath || isMarketingPath || isOnboardingPath || isWebhookPath || isHealthPath) {
    return NextResponse.next();
  }

  let supabaseEnv: ReturnType<typeof getSupabasePublicEnv>;
  try {
    supabaseEnv = getSupabasePublicEnv();
  } catch (error) {
    if (error instanceof SupabaseEnvError) {
      return NextResponse.json(
        { error: 'Service is not configured. Missing Supabase environment variables.' },
        { status: 503 }
      );
    }
    throw error;
  }

  // Create a response to pass cookies through
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this is critical to keep JWT fresh
  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated user accessing protected route
  if (!user && !isPublicPath && !isOnboardingPath && !isMarketingPath) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user) {
    const { data: claimsData } = await supabase.auth.getClaims();
    // Use 'user_role' — the custom_access_token_hook stores the application role here.
    // Do NOT read 'role' — that is the Postgres-level role ('authenticated') used by PostgREST.
    const claims = (claimsData?.claims ?? {}) as {
      tenant_id?: string;
      user_role?: Role;
      mfa_verified?: boolean;
      aal?: string;
    };

    const role = claims.user_role;
    // Supabase AAL claim: 'aal1' (password-only) or 'aal2' (MFA-verified).
    const mfaVerified = claims.aal === 'aal2';

    // Fail closed: if JWT is missing enriched claims the Custom Access Token
    // Hook either failed or the user has no active role assignment.
    // Redirect to sign-in rather than allowing unenriched JWT through.
    if (!claims.tenant_id || !role) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('error', 'session_invalid');
      return NextResponse.redirect(signInUrl);
    }

    // MFA enforcement — role-based only (not path-based).
    // MFA_REQUIRED_ROLES: platform_super_admin, tenant_admin, mlro.
    // If their role requires MFA and they haven't completed it, redirect to setup.
    const roleMfaRequired = MFA_REQUIRED_ROLES.includes(role);
    if (roleMfaRequired && !mfaVerified) {
      return NextResponse.redirect(new URL('/mfa-setup', request.url));
    }

    // Admin-only path check (tenant_admin and platform_super_admin only)
    const isAdminPath = ADMIN_ONLY_PATHS.some((p) => pathname.includes(p));
    if (isAdminPath && role !== Role.TENANT_ADMIN && role !== Role.PLATFORM_SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // MLRO-restricted paths (mlro, tenant_admin, platform_super_admin)
    const isMlroPath = MLRO_PATHS.some((p) => pathname.includes(p));
    if (isMlroPath && role !== Role.MLRO && role !== Role.TENANT_ADMIN && role !== Role.PLATFORM_SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

