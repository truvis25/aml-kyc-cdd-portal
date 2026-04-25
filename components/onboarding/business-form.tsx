'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types';

interface BusinessFormProps {
  tenantSlug: string;
  sessionId: string;
  businessId: string;
}

export function BusinessForm({ tenantSlug, sessionId, businessId }: BusinessFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setApiError(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const dataRes = await fetch(`/api/businesses/${businessId}/data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!dataRes.ok) {
        const body = await dataRes.json();
        if (body.details?.fieldErrors) {
          setErrors(body.details.fieldErrors);
          return;
        }
        throw new Error(body.error ?? 'Failed to save business data');
      }

      const stepRes = await fetch(`/api/sessions/${sessionId}/steps/business-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }),
      });
      if (!stepRes.ok) throw new Error('Failed to advance session');

      router.push(`/${tenantSlug}/onboard/${sessionId}/documents`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(name: string) {
    const errs = errors[name];
    if (!errs?.length) return null;
    return <p className="mt-1 text-xs text-red-600">{errs[0]}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Details */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Company Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input name="company_name" required className="input-field" placeholder="As on trade license" />
            {fieldError('company_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade License Number <span className="text-red-500">*</span>
            </label>
            <input name="trade_license_number" required className="input-field" />
            {fieldError('trade_license_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jurisdiction <span className="text-red-500">*</span>
            </label>
            <input name="jurisdiction" required className="input-field" placeholder="e.g. Dubai, ADGM, DIFC" />
            {fieldError('jurisdiction')}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Activity <span className="text-red-500">*</span>
            </label>
            <select name="activity_type" required className="input-field">
              <option value="">Select activity type</option>
              {ACTIVITY_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {fieldError('activity_type')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Issuance Date <span className="text-red-500">*</span>
            </label>
            <input name="trade_license_issued_at" type="date" required className="input-field" />
            {fieldError('trade_license_issued_at')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Expiry Date <span className="text-red-500">*</span>
            </label>
            <input name="trade_license_expires_at" type="date" required className="input-field" />
            {fieldError('trade_license_expires_at')}
          </div>
        </div>
      </section>

      {/* Authorized Representative */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Authorized Representative
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input name="authorized_rep_name" required className="input-field" placeholder="Name as on Emirates ID" />
          {fieldError('authorized_rep_name')}
        </div>
      </section>

      {apiError && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          {apiError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving…' : 'Save & Continue'}
      </button>
    </form>
  );
}
