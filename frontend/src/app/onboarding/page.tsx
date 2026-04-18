'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Validation schemas ─────────────────────────────────────────────────────

const individualSchema = z.object({
  clientType: z.literal('INDIVIDUAL'),
  fullName: z.string().min(2, 'Full name required'),
  dateOfBirth: z
    .string()
    .refine((d) => {
      const age = (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18;
    }, 'Must be 18 or older'),
  nationality: z.string().min(2, 'Nationality required'),
  passportNumber: z.string().min(3, 'Passport number required'),
  passportExpiry: z
    .string()
    .refine((d) => new Date(d) > new Date(), 'Passport must not be expired'),
  residentialAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(2),
    postalCode: z.string().optional(),
  }),
  occupation: z.string().min(2),
  taxResidence: z.string().min(2),
  purposeOfRelationship: z.enum([
    'CORPORATE_SERVICES', 'ASSET_MANAGEMENT', 'TRUST_SERVICES',
    'LEGAL_SERVICES', 'ACCOUNTING_SERVICES', 'REAL_ESTATE',
    'INVESTMENT', 'TRADING', 'OTHER',
  ]),
});

const entitySchema = z.object({
  clientType: z.literal('LEGAL_ENTITY'),
  companyName: z.string().min(2),
  jurisdiction: z.string().min(2),
  registrationNumber: z.string().min(2),
  dateOfIncorporation: z.string(),
  registeredAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(2),
  }),
  businessActivity: z.string().min(5),
  purposeOfRelationship: z.enum([
    'CORPORATE_SERVICES', 'ASSET_MANAGEMENT', 'TRUST_SERVICES',
    'LEGAL_SERVICES', 'ACCOUNTING_SERVICES', 'REAL_ESTATE',
    'INVESTMENT', 'TRADING', 'OTHER',
  ]),
});

type IndividualForm = z.infer<typeof individualSchema>;
type EntityForm = z.infer<typeof entitySchema>;

const PURPOSE_OPTIONS = [
  { value: 'CORPORATE_SERVICES', label: 'Corporate Services' },
  { value: 'ASSET_MANAGEMENT', label: 'Asset Management' },
  { value: 'TRUST_SERVICES', label: 'Trust Services' },
  { value: 'LEGAL_SERVICES', label: 'Legal Services' },
  { value: 'ACCOUNTING_SERVICES', label: 'Accounting Services' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'TRADING', label: 'Trading' },
  { value: 'OTHER', label: 'Other' },
];

function FormField({
  label, error, required, children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />
  );
}

function Select({
  children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    >
      {children}
    </select>
  );
}

export default function OnboardingPage() {
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'LEGAL_ENTITY'>('INDIVIDUAL');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const individualForm = useForm<IndividualForm>({
    resolver: zodResolver(individualSchema),
    defaultValues: { clientType: 'INDIVIDUAL' },
  });

  const entityForm = useForm<EntityForm>({
    resolver: zodResolver(entitySchema),
    defaultValues: { clientType: 'LEGAL_ENTITY' },
  });

  const onSubmitIndividual = async (data: IndividualForm) => {
    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmitEntity = async (data: EntityForm) => {
    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Application Submitted</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Your onboarding application has been submitted successfully.
            Our compliance team will review your information and contact you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Client Onboarding</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Complete KYC/CDD requirements in compliance with UAE AML/CFT regulations
          </p>
        </div>

        {/* Client Type Selector */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 mb-6">
          {(['INDIVIDUAL', 'LEGAL_ENTITY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setClientType(type)}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                clientType === type
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {type === 'INDIVIDUAL' ? '👤 Individual' : '🏢 Legal Entity'}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {clientType === 'INDIVIDUAL' ? (
            <form onSubmit={individualForm.handleSubmit(onSubmitIndividual)} className="p-8 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required error={individualForm.formState.errors.fullName?.message}>
                  <Input {...individualForm.register('fullName')} placeholder="As on passport" />
                </FormField>
                <FormField label="Date of Birth" required error={individualForm.formState.errors.dateOfBirth?.message}>
                  <Input type="date" {...individualForm.register('dateOfBirth')} />
                </FormField>
                <FormField label="Nationality" required error={individualForm.formState.errors.nationality?.message}>
                  <Input {...individualForm.register('nationality')} placeholder="UAE, UK, US..." />
                </FormField>
                <FormField label="Passport Number" required error={individualForm.formState.errors.passportNumber?.message}>
                  <Input {...individualForm.register('passportNumber')} />
                </FormField>
                <FormField label="Passport Expiry" required error={individualForm.formState.errors.passportExpiry?.message}>
                  <Input type="date" {...individualForm.register('passportExpiry')} />
                </FormField>
                <FormField label="Occupation" required error={individualForm.formState.errors.occupation?.message}>
                  <Input {...individualForm.register('occupation')} />
                </FormField>
                <FormField label="Tax Residence" required error={individualForm.formState.errors.taxResidence?.message}>
                  <Input {...individualForm.register('taxResidence')} placeholder="Country of tax residence" />
                </FormField>
                <FormField label="Purpose of Relationship" required error={individualForm.formState.errors.purposeOfRelationship?.message}>
                  <Select {...individualForm.register('purposeOfRelationship')}>
                    <option value="">Select purpose...</option>
                    {PURPOSE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Residential Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Street Address" required error={individualForm.formState.errors.residentialAddress?.line1?.message}>
                      <Input {...individualForm.register('residentialAddress.line1')} placeholder="Street address" />
                    </FormField>
                  </div>
                  <FormField label="City" required error={individualForm.formState.errors.residentialAddress?.city?.message}>
                    <Input {...individualForm.register('residentialAddress.city')} />
                  </FormField>
                  <FormField label="Country" required error={individualForm.formState.errors.residentialAddress?.country?.message}>
                    <Input {...individualForm.register('residentialAddress.country')} />
                  </FormField>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  Submit Application
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  By submitting, you consent to KYC verification under UAE AML/CFT regulations
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={entityForm.handleSubmit(onSubmitEntity)} className="p-8 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">
                Company Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Company Name" required error={entityForm.formState.errors.companyName?.message}>
                    <Input {...entityForm.register('companyName')} placeholder="Full legal name" />
                  </FormField>
                </div>
                <FormField label="Jurisdiction" required error={entityForm.formState.errors.jurisdiction?.message}>
                  <Input {...entityForm.register('jurisdiction')} placeholder="UAE, BVI, Cayman..." />
                </FormField>
                <FormField label="Registration Number" required error={entityForm.formState.errors.registrationNumber?.message}>
                  <Input {...entityForm.register('registrationNumber')} />
                </FormField>
                <FormField label="Date of Incorporation" required error={entityForm.formState.errors.dateOfIncorporation?.message}>
                  <Input type="date" {...entityForm.register('dateOfIncorporation')} />
                </FormField>
                <FormField label="Purpose of Relationship" required error={entityForm.formState.errors.purposeOfRelationship?.message}>
                  <Select {...entityForm.register('purposeOfRelationship')}>
                    <option value="">Select purpose...</option>
                    {PURPOSE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Business Activity" required error={entityForm.formState.errors.businessActivity?.message}>
                    <textarea
                      {...entityForm.register('businessActivity')}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Describe the nature of business..."
                    />
                  </FormField>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Registered Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Street Address" required error={entityForm.formState.errors.registeredAddress?.line1?.message}>
                      <Input {...entityForm.register('registeredAddress.line1')} />
                    </FormField>
                  </div>
                  <FormField label="City" required error={entityForm.formState.errors.registeredAddress?.city?.message}>
                    <Input {...entityForm.register('registeredAddress.city')} />
                  </FormField>
                  <FormField label="Country" required error={entityForm.formState.errors.registeredAddress?.country?.message}>
                    <Input {...entityForm.register('registeredAddress.country')} />
                  </FormField>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">⚠️ UBO Declaration Required</p>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                  You will be required to declare all Ultimate Beneficial Owners (≥25% ownership) in the next step.
                  Missing UBO information will trigger mandatory MLRO escalation.
                </p>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
