import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Product',
  description:
    'A guided tour of TruVis: branded onboarding, screening, 3-D risk scoring, role-aware case queues, four-eyes approvals, and an immutable audit trail.',
};

const SECTIONS: { eyebrow: string; title: string; body: string; bullets: string[] }[] = [
  {
    eyebrow: 'Onboarding',
    title: 'A branded portal your customers will actually finish.',
    body: 'Tenant-branded multi-step flows for individuals and corporates, with append-only versioning so you can prove what was collected and when.',
    bullets: [
      'Per-tenant branding (logo + colour) on the customer portal',
      'KYC-individual and KYB-corporate forms, each step audited',
      'Identity verification (IDV) integrated into the flow — liveness, OCR and face match',
      'Document upload to private Supabase buckets with 15-minute signed URLs',
      'Resumable sessions; abandonment events surfaced to your team',
      'Consent capture with version, timestamp and IP — DPA evidence in one row',
    ],
  },
  {
    eyebrow: 'Screening',
    title: 'Screen sanctions and PEPs without the spreadsheet.',
    body: 'A leading sanctions and PEP screening provider is wired in, with a hit-resolution workflow your analysts can run inside the case.',
    bullets: [
      'Sanctions and PEP coverage out of the box',
      'Hit resolution: confirm, dismiss, escalate — with audit trail',
      'Webhook queue with deterministic retries (pg_cron + webhook_events)',
      'Pluggable adapter pattern — bring your own provider when you scale',
    ],
  },
  {
    eyebrow: 'Risk',
    title: '3-D risk scoring you can defend in a meeting.',
    body: 'A transparent, tunable model that combines geography, PEP exposure and screening hits into a band your team understands.',
    bullets: [
      'Geography risk from country lists you maintain',
      'PEP and adverse-screening factors per customer',
      'Configurable thresholds per tenant and customer type',
      'Every score linked to the inputs that produced it (no black boxes)',
    ],
  },
  {
    eyebrow: 'Cases & approvals',
    title: 'A workbench, not a ticket queue.',
    body: 'Cases route by risk band; approvals enforce four-eyes; SAR flagging is a first-class action — not an out-of-band email.',
    bullets: [
      '7-role RBAC (Analyst, Senior Reviewer, MLRO, Compliance Officer, Tenant Admin, Read-only, Platform Super-admin)',
      'Queue routing by risk band and customer type',
      'Approval workflow with four-eyes enforcement',
      'Inline notes, RAI emails, escalation, decision recording',
      'SAR flag/unflag with full audit trail',
    ],
  },
  {
    eyebrow: 'Audit & evidence',
    title: 'A regulator-ready audit chain on every action.',
    body: 'audit_log is append-only — UPDATE and DELETE are blocked at the database. Hash-chained rows make tampering detectable.',
    bullets: [
      'Append-only audit_log with hash chain (DB-enforced)',
      'Customer data versioning — every field change a new row',
      'JSON-L export for regulator handover',
      'No PII in application logs — sanitiser-enforced at the logger',
      'IP addresses masked to /24 in audit_log',
    ],
  },
  {
    eyebrow: 'Admin & operations',
    title: 'Tenant-by-tenant configuration without an engineer.',
    body: 'Per-tenant document types, risk thresholds, branding, workflow definitions and user roles — all from the admin UI.',
    bullets: [
      'Per-tenant document type catalogue and required-document policies',
      'Per-tenant risk thresholds and customer-type segmentation',
      'Workflow definitions (JSON today; visual editor on the roadmap)',
      'User invitations, role assignment, MFA enforcement',
      'Webhook ops viewer — see, replay or retry every async event',
    ],
  },
];

export default function ProductPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Product</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            What TruVis actually does, end-to-end.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            A walkthrough of the onboarding-to-decision flow — from the customer&apos;s first
            consent click to the MLRO&apos;s final sign-off and the regulator-ready audit export.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {SECTIONS.map((s, i) => (
            <article
              key={s.title}
              className="grid items-start gap-10 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  {String(i + 1).padStart(2, '0')} · {s.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  {s.title}
                </h2>
                <p className="mt-3 text-gray-700">{s.body}</p>
              </div>
              <ul className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800 shadow-sm lg:col-span-7">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 py-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <CTASection
        title="Want to see this on your own data?"
        body="Bring an anonymised customer file. We will show you onboarding, screening, risk and the audit trail in 20 minutes."
      />
    </>
  );
}
