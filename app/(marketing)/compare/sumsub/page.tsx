import type { Metadata } from 'next';
import { ComparisonTable, type ComparisonRow } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis vs Sumsub',
  description:
    'An honest comparison of TruVis and Sumsub. We use Sumsub for IDV under the hood — and we are very different products above it.',
};

const ROWS: ComparisonRow[] = [
  {
    feature: 'Primary buyer',
    truvis: 'MLRO and Compliance Officer',
    competitor: 'Product and engineering teams',
    truvisHighlight: true,
  },
  {
    feature: 'Shape of the product',
    truvis: 'Case-centric workbench with role-aware queues and four-eyes approvals',
    competitor: 'Verification API + dashboard for review',
    truvisHighlight: true,
  },
  {
    feature: 'Identity verification (IDV)',
    truvis: 'Sumsub passthrough — same coverage, integrated into our flow',
    competitor: 'Native (250+ countries, 14k+ ID templates)',
  },
  {
    feature: 'AML screening',
    truvis: 'ComplyAdvantage adapter; pluggable',
    competitor: 'Native screening + adverse media',
  },
  {
    feature: 'Risk scoring',
    truvis: '3-D model (geography, PEP, screening) you can defend in a meeting',
    competitor: 'Configurable rules + ML risk scoring',
  },
  {
    feature: 'Audit trail',
    truvis: 'Append-only, hash-chained at the database. UPDATE/DELETE blocked.',
    competitor: 'Activity log in dashboard',
    truvisHighlight: true,
  },
  {
    feature: 'goAML / SAR support',
    truvis: 'SAR register + JSON-L export on roadmap (Growth tier)',
    competitor: 'Reporting tools; varies by jurisdiction',
  },
  {
    feature: 'Data residency',
    truvis: 'Bahrain (me1) by default — UAE-aligned',
    competitor: 'Multiple regions; EU/US default',
    truvisHighlight: true,
  },
  {
    feature: 'Tenant isolation',
    truvis: 'Postgres Row Level Security on every table',
    competitor: 'Application-layer multi-tenancy',
  },
  {
    feature: 'Languages and templates',
    truvis: 'English today; Arabic on roadmap',
    competitor: '50+ UI languages; OCR for any script',
  },
  {
    feature: 'Pricing transparency',
    truvis: 'Published AED tiers, no mystery quote',
    competitor: 'Public starting price; volume pricing on request',
    truvisHighlight: true,
  },
  {
    feature: 'Time to first value',
    truvis: 'Sandbox tenant in under 10 minutes',
    competitor: 'Integration-led; days to weeks',
  },
];

export default function CompareSumsubPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Compare</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            TruVis vs Sumsub.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            We use Sumsub for identity verification, so this isn&apos;t an either-or. The honest
            framing: <strong>Sumsub is the IDV API; TruVis is the workbench above it.</strong>{' '}
            Pick TruVis if your buyer is a compliance officer, not an engineer.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ComparisonTable competitorName="Sumsub" rows={ROWS} />
        <p className="mt-6 max-w-3xl text-sm text-gray-600">
          Comparison reflects publicly-stated capabilities at time of writing and our own product
          roadmap. We will update this page as either product changes — and we are happy to walk
          through differences in detail on a call.
        </p>
      </section>

      <section className="bg-gray-50/60 border-y border-gray-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">When to choose Sumsub</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>You need IDV in 200+ jurisdictions today</li>
              <li>Your buyer is a product or engineering team integrating an API</li>
              <li>You already have a compliance case-management system</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h2 className="text-lg font-semibold text-blue-900">When to choose TruVis</h2>
            <ul className="mt-3 space-y-2 text-sm text-blue-900/80">
              <li>Your MLRO needs to run cases, not write integrations</li>
              <li>You operate primarily in the UAE / GCC and want local data residency</li>
              <li>You need a defensible audit trail your regulator will accept</li>
              <li>You want transparent pricing in AED, not a hidden enterprise quote</li>
            </ul>
          </div>
        </div>
      </section>

      <CTASection title="See TruVis side-by-side with your current stack." />
    </>
  );
}
