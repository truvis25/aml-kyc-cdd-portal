import type { Metadata } from 'next';
import { ComparisonTable, type ComparisonRow } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis vs Azakaw',
  description:
    'An honest comparison of TruVis and Azakaw. Both serve UAE compliance teams; we differ on shape, depth and pricing transparency.',
};

const ROWS: ComparisonRow[] = [
  {
    feature: 'Primary buyer',
    truvis: 'MLRO and Compliance Officer',
    competitor: 'Compliance teams across UAE financial and DNFBP segments',
  },
  {
    feature: 'Shape of the product',
    truvis: 'Case-centric workbench — queues, four-eyes, audit chain',
    competitor: 'Compliance OS — KYC + KYB + transaction monitoring',
    truvisHighlight: true,
  },
  {
    feature: 'UAE Pass / Emirates ID',
    truvis: 'On roadmap (Growth tier)',
    competitor: 'Native integration today',
  },
  {
    feature: 'goAML SAR submission',
    truvis: 'SAR register + JSON-L export; direct submission on roadmap',
    competitor: 'Direct submission supported',
  },
  {
    feature: 'Identity verification',
    truvis: 'Sumsub passthrough',
    competitor: 'Native + 14k ID templates',
  },
  {
    feature: 'Transaction monitoring',
    truvis: 'Not in scope (compliance workbench focus)',
    competitor: 'Included',
  },
  {
    feature: 'Audit trail',
    truvis: 'Append-only, hash-chained at the database',
    competitor: 'Activity log in platform',
    truvisHighlight: true,
  },
  {
    feature: 'Data residency',
    truvis: 'Bahrain (me1) by default',
    competitor: 'UAE / GCC',
  },
  {
    feature: 'Workflow customisation',
    truvis: 'JSON-defined workflows; visual editor on roadmap',
    competitor: 'No-code drag-and-drop builder',
  },
  {
    feature: 'Arabic / RTL UI',
    truvis: 'On roadmap (Growth tier)',
    competitor: 'Supported',
  },
  {
    feature: 'Pricing transparency',
    truvis: 'Published AED tiers from AED 1,500 / month',
    competitor: 'Enterprise quote on request',
    truvisHighlight: true,
  },
  {
    feature: 'Time to first value',
    truvis: 'Sandbox tenant in under 10 minutes',
    competitor: 'Implementation-led onboarding',
    truvisHighlight: true,
  },
];

export default function CompareAzakawPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Compare</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            TruVis vs Azakaw.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            Both products serve UAE compliance teams. Azakaw is broader (transaction monitoring,
            UAE Pass, direct goAML). TruVis is sharper on the workbench layer:{' '}
            <strong>case management, four-eyes, and a hash-chained audit trail</strong>, with
            transparent AED pricing and a sandbox you can poke at today.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ComparisonTable competitorName="Azakaw" rows={ROWS} />
        <p className="mt-6 max-w-3xl text-sm text-gray-600">
          Comparison reflects publicly-stated capabilities at time of writing and our own product
          roadmap. We will update this page as either product changes — and we are happy to walk
          through differences in detail on a call.
        </p>
      </section>

      <section className="bg-gray-50/60 border-y border-gray-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">When to choose Azakaw</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>You need transaction monitoring as part of the same product</li>
              <li>You need direct UAE Pass and goAML submission today</li>
              <li>You want a no-code workflow builder out of the box</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h2 className="text-lg font-semibold text-blue-900">When to choose TruVis</h2>
            <ul className="mt-3 space-y-2 text-sm text-blue-900/80">
              <li>You want the simplest, fastest case workbench for your MLRO</li>
              <li>You care about defensible audit — hash-chained, DB-enforced</li>
              <li>You want published pricing without an enterprise sales cycle</li>
              <li>You prefer to start small and add transaction monitoring later</li>
            </ul>
          </div>
        </div>
      </section>

      <CTASection title="See TruVis on a 20-minute call." />
    </>
  );
}
