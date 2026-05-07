import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Product — The compliance platform MLROs trust',
  description:
    'TruVis: UAE Pass liveness, Emirates ID parse, 235+ list AML screening, MLRO case workbench, SAR/goAML export, and hash-chained audit trail. One platform, one data model.',
};

const SECTIONS: { eyebrow: string; title: string; body: string; bullets: string[] }[] = [
  {
    eyebrow: 'KYC/KYB Onboarding',
    title: 'UAE Pass liveness, Emirates ID parse, resumable multi-step flows.',
    body: 'Customers see your branding. Your auditor sees every step — submission timestamp, consent signature with IP, IDV result, document hash. KYC for individuals and KYB for corporates, each step recorded.',
    bullets: [
      'UAE Pass liveness check and Emirates ID OCR parse — out of the box',
      'Tenant-branded portal: per-tenant logo, colour, and domain',
      'KYC-individual and KYB-corporate forms; every step timestamped and user-IP recorded',
      'Resumable multi-step flows — customers return where they left off; both timestamps tracked',
      'Consent capture with version, timestamp, and IP — UAE PDPL evidence in one row',
      '15-minute signed URLs on every document — no caching, no leaks, fresh per request',
    ],
  },
  {
    eyebrow: 'AML Screening & Monitoring',
    title: '235+ lists. Real-time. Push alerts on every update.',
    body: 'Screen against 235+ sanctions lists, PEP registers, and adverse media in under 150ms. Ongoing re-screening fires push alerts on every watchlist update — not nightly batch. Hit resolution runs inside the case workbench.',
    bullets: [
      '235+ sanctions lists, PEP registers, and adverse media sources in real time',
      'Sub-150ms average latency — screening completes before the onboarding form submits',
      'Ongoing re-screening: push alert fires when a customer matches a new watchlist entry',
      'Hit resolution workflow inside the case: confirm, dismiss, or escalate — each action recorded',
      'Pluggable adapter pattern — swap or add screening providers without re-engineering',
    ],
  },
  {
    eyebrow: 'Case Management & MLRO Workbench',
    title: 'Queue, SLA tracking, RAI, SAR drafting with goAML XML export.',
    body: 'The workbench your MLRO opens in the morning. Role-aware case queue, SLA timers, four-eyes enforcement, EDD section, RAI emails, and SAR drafting with goAML XML export — tipping-off masking enforced at the schema layer.',
    bullets: [
      'Role-aware queues: Analyst → Senior Reviewer → MLRO, each role sees their own cases only',
      'SLA tracking with configurable timers per case type and risk band',
      'Four-eyes enforcement: case cannot close without two signatures; both user IDs and timestamps recorded',
      'EDD section with structured evidence capture and MLRO sign-off',
      'SAR drafting with goAML XML export; SHA-256 hash bound to audit row',
      'Tipping-off masking: SAR visibility restricted to MLRO and Compliance Officer at schema level',
    ],
  },
  {
    eyebrow: 'Audit & Reporting',
    title: 'Hash-chained, append-only. Regulator-ready on demand.',
    body: 'Every compliance action is immutable and hash-chained. Altering a single row breaks the SHA-256 chain and is forensically detectable. 7-year retention. JSON-L export for regulator handover. Regulator-ready case files on demand.',
    bullets: [
      'Append-only audit_log: SHA-256 hash chain, tamper-detectable, UPDATE/DELETE blocked at database',
      'Customer data versioning: no bare UPDATEs; every field change creates a new append-only row',
      'goAML XML export with hash bound to audit row — regulators can verify file integrity',
      '7-year retention by default; JSON-L export for CBUAE, DFSA, FSRA, or VARA handover',
      'No PII in application logs: customer_id, case_id, event_type — never names or ID numbers',
      'Regulator-ready case file export: all documents, decisions, and audit events in one package',
    ],
  },
];

export default function ProductPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Platform</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            The compliance platform MLROs trust to defend every decision.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            One data model. One audit trail. One vendor relationship. No integration debt.
            From the customer&apos;s first UAE Pass check to the MLRO&apos;s goAML submission.
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
        title="See TruVis handling your exact compliance workflow."
        body="Reserve your demo — 30 minutes, no pitch deck, your workflow our focus."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
