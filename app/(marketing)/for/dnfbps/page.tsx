import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis for DNFBPs',
  description:
    'TruVis for UAE DNFBPs — real estate brokers, gold and precious-metals dealers, law firms, accountants and corporate service providers. Onboard, screen, score and decide with regulator-ready audit.',
};

const SEGMENTS: { name: string; pain: string; truvisFit: string }[] = [
  {
    name: 'Real-estate brokers and agents',
    pain: 'Source-of-funds checks under MoE supervision, beneficial-owner mapping for corporate buyers, ongoing PEP screening on landlords and tenants.',
    truvisFit: 'KYB with corporate-purchaser flow, ComplyAdvantage screening, document evidence in the case file.',
  },
  {
    name: 'Dealers in valuable metals and precious stones',
    pain: 'AED 55,000 cash-transaction threshold, walk-in customers, repeat-buyer monitoring, retention of identification evidence.',
    truvisFit: 'Quick KYC capture, retention timer per record, audit chain that survives a thematic inspection.',
  },
  {
    name: 'Lawyers, notaries and accountants',
    pain: 'Conflict-of-interest screening on engagements, ongoing client risk reviews, MLRO sign-off recorded.',
    truvisFit: 'Four-eyes approval workflow, MLRO queue, append-only audit log per matter.',
  },
  {
    name: 'Company and trust service providers',
    pain: 'UBO recursion, multi-entity structures, constant change-of-circumstance updates.',
    truvisFit: 'KYB with corporate hierarchy, customer-data versioning so every change is recorded.',
  },
];

export default function DnfbpsPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            For DNFBPs
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Built for UAE DNFBPs that take compliance seriously.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            UAE Federal Decree-Law No. 10 of 2025 raised the bar for DNFBPs. Fines reach AED 5
            million per violation. TruVis gives you a defensible workflow — onboarding, screening,
            risk and audit — designed for the six DNFBP categories the Ministry of Economy
            supervises.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          By segment
        </h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {SEGMENTS.map((s) => (
            <article key={s.name} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
              <p className="mt-3 text-sm">
                <span className="font-semibold text-gray-700">The pain </span>
                <span className="text-gray-700">{s.pain}</span>
              </p>
              <p className="mt-3 text-sm">
                <span className="font-semibold text-blue-700">TruVis fit </span>
                <span className="text-gray-800">{s.truvisFit}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                The MoE&apos;s ten-step Customer Risk Assessment, automated.
              </h2>
              <p className="mt-3 text-gray-700">
                The Ministry of Economy&apos;s implementation guide expects DNFBPs to score every
                customer at onboarding, at periodic review, and on every change of circumstance.
                TruVis runs the score for you, records the inputs, and forces a re-score the moment
                a relevant field changes.
              </p>
            </div>
            <ul className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800 shadow-sm">
              <li className="flex items-start gap-2 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                Geography risk from country lists you maintain
              </li>
              <li className="flex items-start gap-2 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                PEP and adverse-screening factors per customer
              </li>
              <li className="flex items-start gap-2 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                Configurable thresholds per customer type
              </li>
              <li className="flex items-start gap-2 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                Re-score automatically on customer-data changes
              </li>
              <li className="flex items-start gap-2 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                Score linked to inputs in the audit trail
              </li>
            </ul>
          </div>
        </div>
      </section>

      <CTASection
        title="Talk to us about your DNFBP segment."
        body="Bring your current onboarding form. We will map it into TruVis on the call."
      />
    </>
  );
}
