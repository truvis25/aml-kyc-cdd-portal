'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IDVFormProps {
  tenantSlug: string;
  sessionId: string;
  customerId: string;
}

export function IDVForm({ tenantSlug, sessionId }: IDVFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'review'>('pending');
  const [applicantId, setApplicantId] = useState<string | null>(null);

  // Initialize Sumsub Web SDK
  useEffect(() => {
    const initializeIDV = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Start IDV (create applicant)
        const startRes = await fetch('/api/onboarding/idv/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingSessionId: sessionId }),
        });

        if (!startRes.ok) {
          const errData = await startRes.json();
          throw new Error(errData.error || 'Failed to start identity verification');
        }

        const { applicantId: appId, accessToken } = await startRes.json();
        setApplicantId(appId);

        // Step 2: Load Sumsub Web SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.sumsub.com/js/applicant-sdk/build/index.js';
        script.async = true;
        script.onload = () => {
          // SDK loaded, initialize
          initializeSDK(appId, accessToken);
        };
        script.onerror = () => {
          setError('Failed to load identity verification service. Please try again later.');
        };
        document.head.appendChild(script);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsLoading(false);
      }
    };

    initializeIDV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const initializeSDK = useCallback(
    (appId: string, accessToken: string) => {
      try {
        // @ts-expect-error - Sumsub SDK types not available
        window.ApplicantSDK?.SumsubWebSdk?.openApplicant(
          {
            accessToken,
            applicantId: appId,
            // Lifecycle callbacks
            onMessage: () => {
              // SDK progress events can include identity metadata; do not log them.
            },
            onError: (error: { message: string }) => {
              setError(`Identity verification error: ${error.message}`);
            },
            onComplete: async () => {
              // Verification complete, poll for result
              await pollVerificationStatus();
            },
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize SDK';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId]
  );

  const pollVerificationStatus = useCallback(async () => {
    if (!applicantId) return;

    try {
      const maxAttempts = 30; // 30 seconds with 1s polling
      let attempts = 0;

      const poll = async (): Promise<boolean> => {
        const res = await fetch(`/api/onboarding/idv/status?sessionId=${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch status');

        const data = await res.json() as { status: string; reviewResult?: { reasons?: string[] } };

        if (data.status === 'approved') {
          setStatus('approved');
          return true;
        }

        if (data.status === 'rejected') {
          setStatus('rejected');
          setError(`Verification was rejected. Reason: ${data.reviewResult?.reasons?.[0] || 'Unknown'}`);
          return true;
        }

        if (data.status === 'review') {
          setStatus('review');
          setError('Your verification is under review. You will be notified of the result.');
          return true;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return poll();
        }

        return false;
      };

      const success = await poll();
      if (success && status === 'approved') {
        // Auto-advance to next step
        setTimeout(() => {
          router.push(`/${tenantSlug}/onboard/${sessionId}/documents`);
        }, 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error checking verification status';
      setError(message);
    }
  }, [applicantId, sessionId, tenantSlug, status, router]);

  const handleRetry = () => {
    setError(null);
    setStatus('pending');
    window.location.reload();
  };

  const handleSkip = () => {
    // Skip IDV and proceed to documents (optional based on tenant config)
    router.push(`/${tenantSlug}/onboard/${sessionId}/documents`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border b-2 border-gray-300 border-t-gray-900" />
        <p className="mt-4 text-sm text-gray-500">Loading identity verification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div id="sumsub-applicant" className="min-h-96" />

      {status === 'approved' && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✓ Identity verification approved. Proceeding to next step...
          </AlertDescription>
        </Alert>
      )}

      {status === 'rejected' && (
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="default">
            Try Again
          </Button>
          <Button onClick={handleSkip} variant="outline">
            Skip for Now
          </Button>
        </div>
      )}

      {(status === 'pending' || status === 'review') && (
        <div className="flex gap-3">
          <Button onClick={handleSkip} variant="outline" className="ml-auto">
            Skip for Now
          </Button>
        </div>
      )}
    </div>
  );
}
