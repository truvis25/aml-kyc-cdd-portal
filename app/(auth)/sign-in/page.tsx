'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Role, MFA_REQUIRED_ROLES } from '@/lib/constants/roles';

function getAuthErrorMessage(search: string) {
  const params = new URLSearchParams(search);
  const authError = params.get('error');

  if (authError === 'session_invalid') return 'Unable to verify your session. Please sign in again or contact your administrator if the problem persists.';
  if (authError === 'session_refresh_failed') return 'Your MFA setup is complete, but your session could not be refreshed. Please sign in again.';
  if (authError === 'mfa_required') return 'Multi-factor verification is required for your role. Sign in and complete verification.';
  if (authError === 'auth_callback_failed') return 'The password reset link is invalid or has expired. Please request a new one.';

  return null;
}

function getSuccessMessage(search: string) {
  const success = new URLSearchParams(search).get('success');
  if (success === 'password_reset') return 'Your password has been updated. You can now sign in with your new password.';
  return null;
}

function getSafeRedirectTo(search: string) {
  if (typeof window === 'undefined') return '/dashboard';

  const redirectTo = new URLSearchParams(search).get('redirectTo');
  if (!redirectTo) return '/dashboard';

  try {
    const redirectUrl = new URL(redirectTo, window.location.origin);
    if (redirectUrl.origin === window.location.origin) {
      return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
    }
  } catch {
    // Fallback handled below.
  }

  return '/dashboard';
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Generic error message — never reveal whether email exists or not
  const [error, setError] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getAuthErrorMessage(window.location.search)
  );
  const [successMessage] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getSuccessMessage(window.location.search)
  );

  function navigatePostSignIn() {
    const safeRedirectTo = getSafeRedirectTo(window.location.search);
    router.push(safeRedirectTo);
    router.refresh();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      // Generic error — do NOT differentiate between wrong email and wrong password
      // This prevents user enumeration attacks
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    const { data: claimsData } = await supabase.auth.getClaims(signInData.session.access_token);
    const claims = (claimsData?.claims ?? {}) as { role?: Role };

    if (claims.role && MFA_REQUIRED_ROLES.includes(claims.role)) {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aalError && aalData?.currentLevel !== 'aal2' && aalData?.nextLevel === 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        const factor = factorsError
          ? null
          : factorsData?.totp.find((f) => f.status === 'verified') ?? null;

        if (factor) {
          setMfaFactorId(factor.id);
          setLoading(false);
          return;
        }

        router.push('/mfa-setup');
        router.refresh();
        setLoading(false);
        return;
      }
    }

    navigatePostSignIn();
    setLoading(false);
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code: mfaCode,
    });

    if (verifyError) {
      setError('Invalid code. Please check your authenticator app and try again.');
      setLoading(false);
      return;
    }

    navigatePostSignIn();
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">TruVis</h1>
            <p className="text-sm text-gray-500 mt-1">AML / KYC / CDD Platform</p>
          </div>

          <h2 className="text-xl font-medium text-gray-900 mb-6">Sign in to your account</h2>

          {successMessage && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 mb-4">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {mfaFactorId ? (
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <p className="text-sm text-gray-700">
                Enter the 6-digit code from your authenticator app to complete sign-in.
              </p>
              <div className="space-y-1">
                <Label htmlFor="mfa-code">Authentication code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={loading}
                  autoComplete="one-time-code"
                  aria-describedby="mfa-code-help"
                />
                <p id="mfa-code-help" className="text-xs text-gray-500">
                  Enter exactly 6 digits to enable verification.
                </p>
              </div>
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading || mfaCode.length !== 6}>
                  {loading ? 'Verifying…' : 'Verify and continue'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    setMfaFactorId(null);
                    setMfaCode('');
                  }}
                >
                  Back to sign-in
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-gray-500 text-center">
            Access is by invitation only. Contact your administrator to request access.
          </p>
        </div>
      </div>
    </div>
  );
}
