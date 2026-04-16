'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Generic error message — never reveal whether email exists or not
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');

    if (authError === 'session_invalid') {
      setError(
        'Unable to verify your session. Please sign in again or contact your administrator if the problem persists.'
      );
      return;
    }

    if (authError === 'session_refresh_failed') {
      setError(
        'Your MFA setup is complete, but your session could not be refreshed. Please sign in again.'
      );
    }
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Generic error — do NOT differentiate between wrong email and wrong password
      // This prevents user enumeration attacks
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    // Redirect to dashboard on success
    // Middleware will check MFA requirement and redirect to /mfa-setup if needed
    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
    let safeRedirectTo = '/dashboard';
    if (redirectTo) {
      try {
        const redirectUrl = new URL(redirectTo, window.location.origin);
        if (redirectUrl.origin === window.location.origin) {
          safeRedirectTo = `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
        }
      } catch {
        safeRedirectTo = '/dashboard';
      }
    }
    router.push(safeRedirectTo);
    router.refresh();
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
              <Label htmlFor="password">Password</Label>
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

          <p className="mt-6 text-xs text-gray-500 text-center">
            Access is by invitation only. Contact your administrator to request access.
          </p>
        </div>
      </div>
    </div>
  );
}
