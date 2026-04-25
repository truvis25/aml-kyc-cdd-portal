'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ConsentFormProps {
  tenantSlug: string;
  sessionId: string;
  customerId: string;
  nextStepPath: string;
}

export function ConsentForm({ tenantSlug, sessionId, customerId, nextStepPath }: ConsentFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    data_processing: false,
    aml_screening: false,
    identity_verification: false,
    third_party_sharing: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRequired = values.data_processing && values.aml_screening && values.identity_verification;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRequired) return;

    setSubmitting(true);
    setError(null);

    try {
      const consentRes = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, ...values }),
      });
      if (!consentRes.ok) throw new Error('Failed to submit consent');

      const stepRes = await fetch(`/api/sessions/${sessionId}/steps/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }),
      });
      if (!stepRes.ok) throw new Error('Failed to advance session');

      router.push(nextStepPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const checkboxes: { key: keyof typeof values; label: string; required: boolean; description: string }[] = [
    {
      key: 'data_processing',
      label: 'Data Processing',
      required: true,
      description: 'I consent to the processing of my personal data for KYC/AML compliance purposes.',
    },
    {
      key: 'aml_screening',
      label: 'AML Screening',
      required: true,
      description: 'I consent to screening against AML watchlists and sanctions lists.',
    },
    {
      key: 'identity_verification',
      label: 'Identity Verification',
      required: true,
      description: 'I consent to identity verification using the documents I will provide.',
    },
    {
      key: 'third_party_sharing',
      label: 'Third Party Sharing',
      required: false,
      description: 'I consent to sharing my information with authorized third-party compliance providers.',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p>
          Before we can process your application, we need your consent to collect and use
          your personal information in accordance with applicable AML/KYC regulations.
          The first three consents below are required to proceed.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="sr-only">Consent options</legend>
        {checkboxes.map(({ key, label, required, description }) => (
          <label key={key} className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="text-sm font-medium text-gray-900">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="block text-sm text-gray-500 mt-0.5">{description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!allRequired || submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'I Agree & Continue'}
      </button>
    </form>
  );
}
