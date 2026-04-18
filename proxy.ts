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
 * 4. Enforce MFA for roles that require it
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
];

// Routes requiring specific roles
const ADMIN_ONLY_PATHS = ['/admin'];
const MLRO_PATHS = ['/audit'];

// Routes requiring MFA verification
const MFA_REQUIRED_PATHS = ['/admin', '/audit'];

export async function proxy(request: NextRequest) {
  return middleware(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // Allow onboarding routes (customer-facing, session-based auth)
  const isOnboardingPath = pathname.startsWith('/onboard');
  // Allow API routes that are webhook receivers (no JWT required — validated by signature)
  const isWebhookPath = pathname.startsWith('/api/webhooks/');

  if (isPublicPath || isOnboardingPath || isWebhookPath) {
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
  if (!user && !isPublicPath && !isOnboardingPath) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user) {
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = (claimsData?.claims ?? {}) as {
      tenant_id?: string;
      role?: Role;
      mfa_verified?: boolean;
      aal?: string;
    };

    const role = claims.role;
    const mfaVerified = claims.aal === 'aal2';

    // Fail closed: if JWT is missing enriched claims the Custom Access Token
    // Hook either failed or the user has no active role assignment.
    // Redirect to sign-in rather than allowing unenriched JWT through.
    if (!claims.tenant_id || !role) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('error', 'session_invalid');
      return NextResponse.redirect(signInUrl);
    }

    // Check MFA requirement for sensitive paths
    const requiresMfa = MFA_REQUIRED_PATHS.some((p) => pathname.includes(p));
    const roleMfaRequired = role ? MFA_REQUIRED_ROLES.includes(role) : false;

    if ((requiresMfa || roleMfaRequired) && !mfaVerified) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectTo', pathname);
      signInUrl.searchParams.set('error', 'mfa_required');
      return NextResponse.redirect(signInUrl);
    }

    // Admin-only path check
    const isAdminPath = ADMIN_ONLY_PATHS.some((p) => pathname.includes(p));
    if (isAdminPath && role !== Role.TENANT_ADMIN && role !== Role.PLATFORM_SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // MLRO-only paths
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
