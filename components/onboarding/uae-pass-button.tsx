'use client';

import { useState, useTransition } from 'react';

interface UaePassButtonProps {
  sessionId: string;
}

const FAILURE_REASON_COPY: Record<string, string> = {
  not_configured: 'UAE Pass is not configured for this deployment.',
  state_unknown: 'The UAE Pass session expired. Please try again.',
  state_already_completed: 'This UAE Pass session has already been used. Please start over.',
  idp_returned_error: 'UAE Pass declined the request. Please try again or fill in the form manually.',
  token_exchange_failed: 'We could not complete the UAE Pass sign-in. Please try again.',
  id_token_invalid: 'UAE Pass returned an unreadable identity token.',
  id_token_signature_invalid: 'UAE Pass identity token signature did not validate.',
  id_token_audience_mismatch: 'UAE Pass identity token was issued for a different application.',
  id_token_issuer_mismatch: 'UAE Pass identity token came from an unexpected issuer.',
  id_token_expired: 'UAE Pass identity token has expired. Please retry.',
  id_token_nonce_mismatch: 'UAE Pass identity token did not match this session. Please retry.',
  userinfo_failed: 'UAE Pass did not return profile information.',
  assurance_level_too_low:
    'Your UAE Pass account is not at the assurance level required for KYC. Visit a UAE Pass kiosk to upgrade to SOP3.',
  unexpected_error: 'Something went wrong with UAE Pass. Please try again.',
};

export function UaePassButton({ sessionId }: UaePassButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Read URL once on render to surface success/failure banners.
  const inlineState = readInlineState();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/uae-pass/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingSessionId: sessionId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          const reasonCopy = body.code ? FAILURE_REASON_COPY[body.code] : null;
          setError(reasonCopy ?? body.error ?? 'Failed to initiate UAE Pass.');
          return;
        }
        const body = (await res.json()) as { authorizationUrl: string };
        window.location.href = body.authorizationUrl;
      } catch {
        setError('Failed to reach the UAE Pass service. Please try again.');
      }
    });
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
        >
          UAE
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Sign in with UAE Pass</p>
          <p className="mt-0.5 text-xs text-blue-800/80">
            Pre-fill your identity data with your verified UAE Pass profile. We will record the
            result against this onboarding session.
          </p>

          {inlineState?.kind === 'success' && (
            <p className="mt-2 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-800">
              UAE Pass verified. Review the pre-filled fields below before submitting.
            </p>
          )}
          {inlineState?.kind === 'failed' && (
            <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">
              {FAILURE_REASON_COPY[inlineState.reason] ?? FAILURE_REASON_COPY.unexpected_error}
            </p>
          )}
          {error && (
            <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Redirecting…' : 'Continue with UAE Pass'}
          </button>
        </div>
      </div>
    </div>
  );
}

type InlineState =
  | { kind: 'success' }
  | { kind: 'failed'; reason: string }
  | null;

function readInlineState(): InlineState {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const flag = params.get('uae_pass');
  if (flag === 'success') return { kind: 'success' };
  if (flag === 'failed') return { kind: 'failed', reason: params.get('reason') ?? 'unexpected_error' };
  return null;
}
