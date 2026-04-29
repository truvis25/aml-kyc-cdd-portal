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
    title: 'Every form submission is a timestamped, auditable record.',
    body: 'Customers see your branding; your auditor sees the complete chain. KYC and KYB forms track every step: submission time, consent signature with IP, ID verification result, document upload hash.',
    bullets: [
      'Tenant-branded portal with per-tenant branding (logo + colour)',
      'KYC-individual and KYB-corporate forms; every step recorded with timestamp and user IP',
      'Resumable flows: customers can pause at Step 2 and return days later — both timestamps tracked',
      'Sumsub IDV (liveness, OCR, face match) embedded in the workflow',
      'Document upload to private storage with 15-minute signed URLs — no caching, no ambiguity',
      'Consent capture with version, timestamp, and IP — GDPR evidence in one row',
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
    title: 'An approval chain your auditor will recognize.',
    body: 'Analyst flags a case. Senior Reviewer approves. MLRO signs off. Four-eyes is enforced at the database layer. SAR filing is a first-class action, not an email thread.',
    bullets: [
      'Role-aware queues: Analyst → Senior Reviewer → MLRO, each role sees their cases and nothing more',
      'Four-eyes enforcement: a case cannot close without two signatures; both user IDs and timestamps are recorded',
      'SAR queue visible to MLRO and Compliance Officer only (tipping-off protection at the schema layer)',
      'Inline case notes, RAI emails, escalation workflows, decision recording with approval timestamp',
      'SAR flag/unflag transitions are first-class actions with full audit trail (not Slack notifications)',
    ],
  },
  {
    eyebrow: 'Audit & evidence',
    title: 'When a regulator asks to see the chain, you have it.',
    body: 'Every action — form submission, screening hit, risk score, approval, SAR filing — is immutable and hash-chained. Altering a row breaks the chain and is forensically detectable.',
    bullets: [
      'Append-only audit_log with hash chain: each row includes SHA-256 hash of the prior row (tampering is detectable)',
      'Customer data versioning: no bare UPDATEs; every field change creates a new append-only row',
      'goAML XML export bound to audit row with hash — regulator can verify file integrity',
      'No PII in application logs: customer_id, case_id, event_type, timestamp — never names or ID numbers',
      'JSON-L export for regulator handover; audit trail is 10-year retained',
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
