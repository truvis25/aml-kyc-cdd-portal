'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface IdentityFormProps {
  tenantSlug: string;
  sessionId: string;
  customerId: string;
}

const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'residence_permit', label: 'Residence Permit' },
  { value: 'driving_licence', label: "Driver's Licence" },
] as const;

const SOURCE_OF_FUNDS_OPTIONS = [
  'Employment income',
  'Business income',
  'Investment returns',
  'Inheritance',
  'Savings',
  'Pension',
  'Other',
];

export function IdentityForm({ tenantSlug, sessionId, customerId }: IdentityFormProps) {
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
    const data = Object.fromEntries(form.entries());

    // Transform pep_status from checkbox
    const payload = {
      ...data,
      pep_status: form.get('pep_status') === 'on',
    };

    try {
      const dataRes = await fetch(`/api/customers/${customerId}/data`, {
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
        throw new Error(body.error ?? 'Failed to save identity data');
      }

      const stepRes = await fetch(`/api/sessions/${sessionId}/steps/identity`, {
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
      {/* Personal Details */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Personal Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input name="full_name" required className="input-field" placeholder="As on official ID" />
            {fieldError('full_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input name="date_of_birth" type="date" required className="input-field" />
            {fieldError('date_of_birth')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality (ISO 2) <span className="text-red-500">*</span>
            </label>
            <input name="nationality" required maxLength={2} className="input-field uppercase" placeholder="AE" />
            {fieldError('nationality')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country of Residence <span className="text-red-500">*</span>
            </label>
            <input name="country_of_residence" required maxLength={2} className="input-field uppercase" placeholder="AE" />
            {fieldError('country_of_residence')}
          </div>
        </div>
      </section>

      {/* ID Document */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Identity Document
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select name="id_type" required className="input-field">
              <option value="">Select type</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {fieldError('id_type')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Number <span className="text-red-500">*</span>
            </label>
            <input name="id_number" required className="input-field" />
            {fieldError('id_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input name="id_expiry" type="date" required className="input-field" />
            {fieldError('id_expiry')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issuing Country <span className="text-red-500">*</span>
            </label>
            <input name="id_issuing_country" required maxLength={2} className="input-field uppercase" placeholder="AE" />
            {fieldError('id_issuing_country')}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" required className="input-field" />
            {fieldError('email')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input name="phone" required className="input-field" placeholder="+971501234567" />
            {fieldError('phone')}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input name="address_line1" required className="input-field" />
            {fieldError('address_line1')}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input name="address_line2" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input name="city" required className="input-field" />
            {fieldError('city')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input name="postal_code" required className="input-field" />
            {fieldError('postal_code')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input name="country" required maxLength={2} className="input-field uppercase" placeholder="AE" />
            {fieldError('country')}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Compliance Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation <span className="text-red-500">*</span>
            </label>
            <input name="occupation" required className="input-field" />
            {fieldError('occupation')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
            <input name="employer" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source of Funds <span className="text-red-500">*</span>
            </label>
            <select name="source_of_funds" required className="input-field">
              <option value="">Select source</option>
              {SOURCE_OF_FUNDS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldError('source_of_funds')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Relationship <span className="text-red-500">*</span>
            </label>
            <input name="purpose_of_relationship" required className="input-field" placeholder="e.g. Investment account" />
            {fieldError('purpose_of_relationship')}
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="pep_status" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">
                I am (or am associated with) a Politically Exposed Person (PEP)
              </span>
            </label>
          </div>
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
