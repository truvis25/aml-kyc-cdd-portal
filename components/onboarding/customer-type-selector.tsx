'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerTypeSelectorProps {
  tenantSlug: string;
}

export function CustomerTypeSelector({ tenantSlug }: CustomerTypeSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'individual' | 'corporate' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_type: selected }),
      });

      if (!res.ok) throw new Error('Failed to start session');

      const { session } = await res.json();
      router.push(`/${tenantSlug}/onboard/${session.id}/consent`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelected('individual')}
          className={`relative rounded-lg border-2 p-6 text-left transition-colors ${
            selected === 'individual'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Individual</h3>
          <p className="mt-1 text-sm text-gray-500">Personal KYC verification for individual clients.</p>
          {selected === 'individual' && (
            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
              </svg>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSelected('corporate')}
          className={`relative rounded-lg border-2 p-6 text-left transition-colors ${
            selected === 'corporate'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Business</h3>
          <p className="mt-1 text-sm text-gray-500">Corporate KYB verification for companies and businesses.</p>
          {selected === 'corporate' && (
            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Starting…' : 'Continue'}
      </button>
    </div>
  );
}
