import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis for UAE Fintechs — AML-compliant from the first API call',
  description:
    'Onboard UAE customers 3× faster with AML compliance built in. CBUAE AML programme mapping, real-time screening, UAE Pass flow, webhook-based IDV results. CBUAE and DFSA examination-ready.',
};

const PAIN_POINTS: { title: string; body: string }[] = [
  {
    title: 'Manual KYC reviews eat your compliance team’s week — and slow customer activation.',
    body: 'False positives pile up. Each manual review takes 20 minutes. At 50 onboardings a day, your analyst queue overflows before noon and customers wait days for activation. TruVis AI-tuned risk thresholds cut false-positive volume and route only genuine exceptions to your team.',
  },
  {
    title: 'One missed screening hit means regulatory action from CBUAE or DFSA.',
    body: 'A single unresolved sanctions hit during a CBUAE examination is sufficient grounds for enforcement. TruVis screens against 235+ lists in real time and fires push alerts on every watchlist update — not nightly batch. Every hit resolution is recorded in the hash-chained audit trail.',
  },
  {
    title: 'Stitching together four vendors for IDV, screening, cases, and SAR filing creates audit gaps.',
    body: 'IDV here, screening there, cases in a spreadsheet, SAR by email. When the regulator asks for the full evidence chain, none of it links. TruVis closes the gap: one data model, one audit trail, one vendor relationship. No integration debt.',
  },
];

const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Webhook-based IDV results',
    body: 'IDV results fire as webhooks into your application the moment verification completes. No polling, no manual reconciliation. Each result is recorded in the audit trail and linked to the customer record.',
  },
  {
    title: 'Risk-scored onboarding decisions',
    body: 'Every onboarding session produces a 3-D risk score: geography, PEP exposure, and screening hits combined. The score is linked to the inputs — no black box. Your MLRO can defend every band to a regulator.',
  },
  {
    title: 'CBUAE AML programme mapping',
    body: 'TruVis workflows map to the CBUAE AML programme requirements: customer risk assessment, ongoing monitoring, SAR filing obligations, and record retention. CBUAE-examination-ready from day one.',
  },
  {
    title: 'UAE Pass flow',
    body: 'UAE Pass liveness check and Emirates ID parse are available out of the box. The onboarding flow handles the redirect, the result, and the audit record without any custom integration work.',
  },
];

const STEPS: { i: number; t: string; d: string }[] = [
  { i: 1, t: 'Configure', d: 'Configure document types, risk thresholds, and branding in the admin UI. No engineer required.' },
  { i: 2, t: 'Integrate', d: 'Embed the onboarding widget or call the API. IDV and screening are included. Go live in an afternoon.' },
  { i: 3, t: 'Operate', d: 'Onboardings flow into case queues. Analysts triage. MLRO approves under four-eyes. Every decision audited.' },
  { i: 4, t: 'Prove', d: 'Export the hash-chained audit JSON-L for CBUAE, DFSA, or FSRA submissions. Evidence is ready on demand.' },
];

export default function FintechsPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            For Fintechs &amp; EMIs
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Onboard UAE customers 3&times; faster &mdash; AML-compliant from the first API call.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            TruVis is the API-first compliance platform for UAE fintechs. Embed the onboarding
            widget in an afternoon. Real-time AML screening included. MLRO workbench built in.
            CBUAE and DFSA examination-ready from day one.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          The three compliance problems that cost fintechs time, money, and licences
        </h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {PAIN_POINTS.map((p) => (
            <article key={p.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-3 text-sm text-gray-700">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Features built for fintech compliance teams
          </h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-3 text-sm text-gray-700">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          From API keys to CBUAE-ready in four steps
        </h2>
        <ol className="mt-8 grid gap-4 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Step {s.i}
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{s.t}</div>
              <p className="mt-2 text-sm text-gray-700">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <CTASection
        title="See TruVis with your fintech compliance workflow."
        body="Reserve your demo — 30 minutes, no pitch deck, your workflow our focus."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
