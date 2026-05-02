/**
 * GET /api/auth/uae-pass/callback
 *
 * UAE Pass redirects the browser back here with either:
 *   ?code=…&state=…           on success
 *   ?error=…&error_description=…&state=…  on user cancel / IdP failure
 *
 * The handler validates state, exchanges the code for tokens, verifies the
 * ID token, fetches userinfo, and persists the result. On success it 302s
 * the customer back to the onboarding identity page with `?uae_pass=success`
 * so the form can pre-fill from the verified claims. On any failure it
 * still 302s back, but with `?uae_pass=failed&reason=<code>` so the UI can
 * show an inline error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeAuthentication, UaePassError } from '@/modules/auth/uae-pass';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const idpError = url.searchParams.get('error');
  const idpErrorDescription = url.searchParams.get('error_description');

  // Resolve onboarding session + tenant slug from `state` up-front so we have
  // a sane redirect target whether the flow succeeds or fails. If the state
  // is missing or doesn't match a known row we fall back to /sign-in.
  const redirectTarget = state ? await resolveRedirectTargetByState(state, url.origin) : null;

  try {
    const result = await completeAuthentication({
      state,
      code,
      idpError,
      idpErrorDescription,
    });
    const target =
      redirectTarget ??
      (await resolveRedirectTargetByIds(result.tenantId, result.onboardingSessionId, url.origin));
    if (!target) return redirectToSignIn(url, state, 'unexpected_error');

    target.searchParams.set('uae_pass', 'success');
    return NextResponse.redirect(target, 302);
  } catch (err) {
    const reason = err instanceof UaePassError ? err.code : 'unexpected_error';
    if (redirectTarget) {
      redirectTarget.searchParams.set('uae_pass', 'failed');
      redirectTarget.searchParams.set('reason', reason);
      return NextResponse.redirect(redirectTarget, 302);
    }
    return redirectToSignIn(url, state, reason);
  }
}

async function resolveRedirectTargetByState(
  state: string,
  origin: string,
): Promise<URL | null> {
  const db = await createClient();
  const { data } = await db
    .from('uae_pass_authentications')
    .select('onboarding_session_id, tenant_id')
    .eq('state', state)
    .maybeSingle();
  if (!data) return null;
  const row = data as { onboarding_session_id: string; tenant_id: string };
  return resolveRedirectTargetByIds(row.tenant_id, row.onboarding_session_id, origin);
}

async function resolveRedirectTargetByIds(
  tenantId: string,
  sessionId: string,
  origin: string,
): Promise<URL | null> {
  const db = await createClient();
  const { data } = await db
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .maybeSingle();
  const slug = (data as { slug: string } | null)?.slug;
  if (!slug) return null;
  return new URL(`/${slug}/onboard/${sessionId}/identity`, origin);
}

function redirectToSignIn(
  origin: URL,
  state: string | null,
  reason: string,
): NextResponse {
  const fallback = new URL('/sign-in', origin.origin);
  fallback.searchParams.set('uae_pass', 'failed');
  fallback.searchParams.set('reason', reason);
  if (state) fallback.searchParams.set('state', state);
  return NextResponse.redirect(fallback, 302);
}
