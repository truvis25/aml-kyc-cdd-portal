import type { Metadata } from 'next';
import Link from 'next/link';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Compare TruVis',
  description:
    'Where TruVis fits versus the categories of compliance tooling teams typically evaluate: global identity-verification platforms and regional GCC compliance suites.',
};

const VS_GLOBAL_IDV = [
  {
    feature: 'Use case',
    truvis: 'MLRO workbench — case management, approvals, audit',
    competitor: 'Identity verification — document, liveness, biometric match',
  },
  {
    feature: 'Onboarding',
    truvis: 'Tenant-branded portal (KYC + KYB + IDV passthrough + consent)',
    competitor: 'IDV-first, embedded as iframe or API',
  },
  {
    feature: 'Identity verification',
    truvis: 'Embedded via the IDV provider of your choice',
    competitor: '✓ (native)',
  },
  {
    feature: 'Sanctions / PEP screening',
    truvis: '✓ via pluggable adapter (ComplyAdvantage default)',
    competitor: 'Some platforms native, others via partner',
  },
  {
    feature: 'Risk scoring',
    truvis: '✓ Multi-dimension model with per-tenant thresholds',
    competitor: 'Typically risk flags, not a quantified score',
  },
  {
    feature: 'Case queue & approvals',
    truvis: '✓ Role-aware queues, four-eyes approvals enforced',
    competitor: '— (typically API-centric, no MLRO queue)',
  },
  {
    feature: 'Audit trail',
    truvis: '✓ Append-only, hash-chained, customer-versioned',
    competitor: 'Webhook + event logs (not always append-only)',
  },
  {
    feature: 'SAR register & goAML XML',
    truvis: '✓ First-class action; goAML XML export',
    competitor: '— (rarely native to IDV platforms)',
  },
  {
    feature: 'Data residency',
    truvis: 'UAE/Bahrain (me1 region)',
    competitor: 'Global (typically EU / US AWS or GCP)',
  },
  {
    feature: 'Pricing',
    truvis: 'Transparent AED tiers + metered verifications',
    competitor: 'Per-verification, sales-led contract',
  },
  {
    feature: 'Self-serve trial',
    truvis: '✓ 14-day free trial, no card',
    competitor: '— (demo + contract required)',
  },
];

const VS_REGIONAL_SUITE = [
  {
    feature: 'Use case',
    truvis: 'MLRO workbench with embedded onboarding and audit',
    competitor: 'Compliance suite with goAML and registry integrations',
  },
  {
    feature: 'Onboarding',
    truvis: '✓ Branded onboarding (individual + corporate)',
    competitor: '✓ Branded onboarding',
  },
  {
    feature: 'Sanctions / PEP / adverse media',
    truvis: '✓ Sanctions + PEP today; adverse media on roadmap',
    competitor: '✓ Sanctions + PEP + adverse media',
  },
  {
    feature: 'Case queue & approvals',
    truvis: '✓ Role-aware queues, four-eyes approvals enforced',
    competitor: '✓ Workflow + queues',
  },
  {
    feature: 'Audit trail',
    truvis: '✓ Append-only, hash-chained, customer-versioned',
    competitor: 'Audit log per platform',
  },
  {
    feature: 'goAML / FIU submission',
    truvis: 'goAML XML export at v1; direct submission deferred',
    competitor: '✓ Direct API integration where supported',
  },
  {
    feature: 'UAE Pass / Emirates ID',
    truvis: 'On the v1 roadmap (Sprint 2)',
    competitor: '✓ Native',
  },
  {
    feature: 'Self-serve signup',
    truvis: '✓ 14-day trial, no card',
    competitor: '— (typically sales-led)',
  },
  {
    feature: 'Pricing',
    truvis: 'Transparent AED tiers (Starter from AED 1,500)',
    competitor: 'Sales call required',
  },
  {
    feature: 'Tenant config & versioning',
    truvis: '✓ Versioned tenant config, MLRO-acknowledged workflow activation',
    competitor: 'Varies by platform',
  },
];

export default function CompareIndex() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Where we fit</span>
            </p>
            <h1 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              The honest comparison.
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
              Most teams evaluating TruVis are also looking at one of two categories of tooling:
              global identity-verification platforms, or regional GCC compliance suites. We sit
              between them — an MLRO workbench that embeds the IDV you choose and surfaces the
              regional outputs (goAML, UAE-aligned residency) you need.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Category 1</span>
            </p>
            <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[36px]">
              vs global identity-verification platforms
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
              These platforms sell deep IDV: document libraries, liveness, biometric match,
              deepfake detection, mobile SDKs. They&rsquo;re engineering-led products. Our
              orientation is the MLRO and the case workbench — and we embed an IDV provider
              rather than competing on IDV breadth.
            </p>
          </div>
          <div className="mt-10">
            <ComparisonTable competitor="Global IDV platform" rows={VS_GLOBAL_IDV} />
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Category 2</span>
            </p>
            <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[36px]">
              vs regional GCC compliance suites
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
              These platforms market regulator alignment first: goAML submission, UAE Pass,
              Emirates ID, multi-regulator templates. We share that orientation. Our edges are
              transparent SaaS pricing, an audit-grade backbone, and a workbench depth aimed at
              the MLRO&rsquo;s daily routine. Our gaps are direct goAML submission and UAE Pass
              today — both on the v1 roadmap.
            </p>
          </div>
          <div className="mt-10">
            <ComparisonTable competitor="Regional compliance suite" rows={VS_REGIONAL_SUITE} />
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-[32px] leading-[1.2] text-ink">
              The best choice depends on your stack.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              If you need broad global IDV with mobile SDKs, an IDV platform is the safer
              default — and you can layer TruVis above it for the case queue and audit. If
              you need a UAE-licensed compliance posture today with direct goAML submission
              and UAE Pass, a regional suite covers more of those out of the box.
              If you need a transparent SaaS workbench with an audit backbone you can defend
              to a regulator, talk to us.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-demo"
                className="btn-primary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                Book a 20-min call
              </Link>
              <Link
                href="/product"
                className="btn-secondary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                See the product tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
