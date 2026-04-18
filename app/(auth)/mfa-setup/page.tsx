'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'enroll' | 'verify' | 'complete';

export default function MfaSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('enroll');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (!factorsError) {
      const existingVerifiedTotp = factorsData?.totp.find((factor) => factor.status === 'verified');
      if (existingVerifiedTotp) {
        setFactorId(existingVerifiedTotp.id);
        setQrCode(null);
        setSecret(null);
        setStep('verify');
        setLoading(false);
        return;
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'TruVis AML Platform',
    });

    if (enrollError || !data) {
      setError('Failed to start MFA setup. Please try again.');
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep('verify');
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Create a challenge and immediately verify it with the user's TOTP code
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challengeData) {
      setError('Failed to create MFA challenge. Please try again.');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      setError('Invalid code. Please check your authenticator app and try again.');
      setLoading(false);
      return;
    }

    const completeRes = await fetch('/api/auth/mfa/complete', {
      method: 'POST',
    });
    if (!completeRes.ok) {
      let apiError = 'MFA verification succeeded, but account setup could not be completed.';
      try {
        const body = await completeRes.json();
        if (typeof body?.error === 'string') {
          apiError = body.error;
        }
      } catch {
        // Fallback to generic message
      }
      setError(`${apiError} Please try again or contact your administrator.`);
      setLoading(false);
      return;
    }

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      router.push('/sign-in?error=session_refresh_failed');
      router.refresh();
      setLoading(false);
      return;
    }

    setStep('complete');
    setLoading(false);
  }

  function handleComplete() {
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">TruVis</h1>
            <p className="text-sm text-gray-500 mt-1">AML / KYC / CDD Platform</p>
          </div>

          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Set up two-factor authentication
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your role requires MFA. You only need to set this up once.
          </p>

          {step === 'enroll' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                You will need an authenticator app such as Google Authenticator,
                Authy, or 1Password to complete setup.
              </p>
              <Button onClick={handleEnroll} className="w-full" disabled={loading}>
                {loading ? 'Setting up…' : 'Begin MFA setup'}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              {qrCode ? (
                <>
                  <p className="text-sm text-gray-700">
                    Scan this QR code with your authenticator app:
                  </p>
                  {/* QR code displayed as SVG/image from Supabase */}
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCode}
                      alt="MFA QR Code"
                      className="w-48 h-48 border border-gray-200 rounded"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-700">
                  Enter the latest 6-digit code from your authenticator app.
                </p>
              )}
              {secret && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer">Can&apos;t scan? Enter key manually</summary>
                  <code className="block mt-1 p-2 bg-gray-100 rounded font-mono break-all">
                    {secret}
                  </code>
                </details>
              )}
              <form onSubmit={handleVerify} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="code">Enter the 6-digit code from your app</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                  {loading ? 'Verifying…' : 'Verify and activate'}
                </Button>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800 font-medium">
                  Two-factor authentication is now active on your account.
                </p>
                <p className="text-sm text-green-700 mt-1">
                  You will be prompted for your authenticator code on each sign-in.
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Continue to dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
