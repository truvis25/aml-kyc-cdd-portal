import type { Metadata } from 'next';
import Link from 'next/link';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis vs Azakaw',
  description: 'Feature-by-feature comparison of TruVis and Azakaw for AML/KYC compliance in the UAE.',
};

const COMPARISON_ROWS = [
  {
    feature: 'Use case',
    truvis: 'MLRO workbench — case management, approvals, audit',
    competitor: 'UAE compliance platform — KYC, screening, goAML register',
  },
  {
    feature: 'Onboarding',
    truvis: '✓ Tenant-branded portal (KYC, KYB, IDV, consent)',
    competitor: '✓ (Azakaw-branded, goAML-integrated)',
  },
  {
    feature: 'Identity verification',
    truvis: 'Via Sumsub API (or bring your own IDV)',
    competitor: 'Via Kaztech Verify or UAE Pass',

  },
  {
    feature: 'Screening (Sanctions/PEP)',
    truvis: '✓ via ComplyAdvantage (pluggable adapter)',
    competitor: '✓ via multiple providers',
  },
  {
    feature: 'Risk scoring',
    truvis: '✓ 3-D model (geography, PEP, screening)',
    competitor: 'Compliance flags, not quantified risk',
  },
  {
    feature: 'Case queue & approvals',
    truvis: '✓ Role-aware routing, four-eyes enforcement',
    competitor: 'Basic workflow (goAML-integrated)',
  },
  {
    feature: 'Audit trail',
    truvis: '✓ Append-only, hash-chained, customer-versioned',
    competitor: 'Audit log (goAML integrates official audit)',
  },
  {
    feature: 'SAR / goAML register',
    truvis: 'JSON-L export (goAML-ready, submission TBD)',
    competitor: '✓ Direct API integration with goAML',
  },
  {
    feature: 'Data residency',
    truvis: 'Bahrain (me1 region)',
    competitor: 'UAE-based infrastructure',
  },
  {
    feature: 'RBAC & MFA',
    truvis: '✓ Row-level security (RLS) on every table; MFA required',
    competitor: '✓ RBAC per module',
  },
  {
    feature: 'Pricing model',
    truvis: 'Transparent AED tiers (Starter / Growth / Enterprise)',
    competitor: 'Usage-based (per application), requires sales call',
  },
  {
    feature: 'Self-serve trial',
    truvis: '✓ 14-day free trial, no credit card',
    competitor: '— (demo + contract required)',
  },
];

export default function AzakawComparison() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-3xl">
            <h1 className="font-display text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              TruVis <span className="text-ink-soft">vs</span> Azakaw
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft max-w-2xl">
              Azakaw is purpose-built for UAE financial institutions and DNFBPs. The comparison below is honest:
              Azakaw has direct goAML integration and UAE Pass support. We lead on workbench workflow and
              transparent pricing for Tier-2 fintechs.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24 lg:px-10">
          <ComparisonTable competitor="Azakaw" rows={COMPARISON_ROWS} />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[28px] leading-[1.2] text-ink">Where Azakaw leads.</h2>
              <ul className="mt-8 space-y-6">
                <li>
                  <div className="font-medium text-ink">Direct goAML submission</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Azakaw submits SARs directly to goAML via API. We export JSON-L (goAML-ready)
                    — submission is a manual or custom integration step.
                  </p>
                </li>
                <li>
                  <div className="font-medium text-ink">UAE Pass integration</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Azakaw integrates Kaztech Verify and UAE Pass for citizen/resident IDV. We
                    support those via future IDV provider plugins.
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-[28px] leading-[1.2] text-ink">Where TruVis leads.</h2>
              <ul className="mt-8 space-y-6">
                <li>
                  <div className="font-medium text-ink">Compliance workbench</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Azakaw is goAML-centric. We built for the MLRO: case queues, analyst workflow,
                    four-eyes approvals.
                  </p>
                </li>
                <li>
                  <div className="font-medium text-ink">Transparent SaaS pricing</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    AED 1,500/month to start. Azakaw requires a sales call. For Tier-2 fintechs
                    and DNFBPs, we unblock faster evaluation.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-[32px] leading-[1.2] text-ink">
              The roadmap closes the gaps.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              Direct goAML submission is on our roadmap (Q3 2026). UAE Pass integration is a
              pluggable IDV provider (Q2 2026). For now, if you need goAML submission built-in
              and are already invested in Azakaw&rsquo;s stack, Azakaw is the right choice. If
              you need a compliance workbench and can manage goAML exports, we&rsquo;re the fit.
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
