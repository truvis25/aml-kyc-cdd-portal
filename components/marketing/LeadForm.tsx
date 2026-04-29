'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldErrors {
  [field: string]: string | undefined;
}

interface SubmitResponse {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
}

export function LeadForm({ sourcePath }: { sourcePath?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [vertical, setVertical] = useState<'' | 'dnfbp' | 'fintech' | 'bank' | 'other'>('');
  const [message, setMessage] = useState('');
  // Honeypot — kept in DOM but visually hidden. Bots fill it; humans don't.
  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError(null);

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          role,
          vertical: vertical || undefined,
          message,
          source_path: sourcePath,
          website,
        }),
      });

      const json = (await res.json()) as SubmitResponse;

      if (!res.ok) {
        if (json.fieldErrors) {
          setErrors(json.fieldErrors);
        }
        setGlobalError(
          json.error === 'validation_failed'
            ? 'Please correct the highlighted fields.'
            : 'Something went wrong. Please try again.',
        );
        return;
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setRole('');
      setVertical('');
      setMessage('');
    } catch {
      setGlobalError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="text-base font-semibold text-green-900">Thanks — we&apos;ll be in touch.</h3>
        <p className="mt-2 text-sm text-green-800">
          A TruVis team member will reply within one business day to schedule your demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            autoComplete="name"
          />
        </Field>
        <Field id="email" label="Work email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="company" label="Company" error={errors.company}>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={loading}
            autoComplete="organization"
          />
        </Field>
        <Field id="role" label="Your role" error={errors.role}>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="MLRO, Compliance Officer, Founder…"
            disabled={loading}
            autoComplete="organization-title"
          />
        </Field>
      </div>

      <Field id="vertical" label="What best describes you?" error={errors.vertical}>
        <select
          id="vertical"
          value={vertical}
          onChange={(e) => setVertical(e.target.value as typeof vertical)}
          disabled={loading}
          className="input-field"
        >
          <option value="">Select one (optional)</option>
          <option value="dnfbp">DNFBP (real estate, gold, law firm, CSP)</option>
          <option value="fintech">Fintech / EMI / PSP</option>
          <option value="bank">Bank</option>
          <option value="other">Other</option>
        </select>
      </Field>

      <Field id="message" label="Anything we should know?" error={errors.message}>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          rows={4}
          maxLength={2000}
          className={cn(
            'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
          )}
          placeholder="Volume, jurisdictions, current tooling…"
        />
      </Field>

      {/* Honeypot — visually hidden but in the DOM. Real users don't fill this. */}
      <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {globalError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Sending…' : 'Request a demo'}
      </Button>
      <p className="text-xs text-gray-500">
        By submitting you agree to our{' '}
        <Link href="/legal/privacy" className="underline hover:text-gray-700">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
