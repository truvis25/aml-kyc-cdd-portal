import type { Metadata } from 'next';
import Link from 'next/link';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis vs Sumsub',
  description: 'Feature-by-feature comparison of TruVis and Sumsub for AML/KYC compliance.',
};

const COMPARISON_ROWS = [
  {
    feature: 'Use case',
    truvis: 'MLRO workbench — case management, approvals, audit',
    competitor: 'IDV provider — identity verification and screening',
  },
  {
    feature: 'Onboarding',
    truvis: 'Tenant-branded portal (KYC, KYB, IDV passthrough, consent)',
    competitor: 'IDV-first, embedded as iframe or API',
  },
  {
    feature: 'Identity verification',
    truvis: 'Integrated via Sumsub API (or bring your own IDV)',
    competitor: '✓ (native)',
  },
  {
    feature: 'Screening (Sanctions/PEP)',
    truvis: '✓ via ComplyAdvantage (or pluggable adapter)',
    competitor: '✓ via multiple providers',
  },
  {
    feature: 'Risk scoring',
    truvis: '✓ 3-D model (geography, PEP, screening)',
    competitor: 'Risk flags, not scoring',
  },
  {
    feature: 'Case queue & approvals',
    truvis: '✓ Role-aware routing, four-eyes enforcement',
    competitor: '— (API-centric, no queue)',
  },
  {
    feature: 'Audit trail',
    truvis: '✓ Append-only, hash-chained, customer-versioned',
    competitor: 'Webhook logs (not append-only)',
  },
  {
    feature: 'SAR register',
    truvis: '✓ First-class action; goAML-ready JSON-L export',
    competitor: '— (not built for SAR workflow)',
  },
  {
    feature: 'Data residency',
    truvis: 'Bahrain (me1 region)',
    competitor: 'Global (via AWS/GCP regions)',
  },
  {
    feature: 'RBAC & MFA',
    truvis: '✓ Row-level security (RLS) on every table; MFA required for privileged roles',
    competitor: 'SAML/OAuth, per-tenant custom',
  },
  {
    feature: 'Pricing model',
    truvis: 'Transparent AED tiers (Starter / Growth / Enterprise)',
    competitor: 'Usage-based (per verification), requires sales call',
  },
  {
    feature: 'Self-serve trial',
    truvis: '✓ 14-day free trial, no credit card',
    competitor: '— (demo + contract required)',
  },
];

export default function SumsubComparison() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-3xl">
            <h1 className="font-display text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              TruVis <span className="text-ink-soft">vs</span> Sumsub
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft max-w-2xl">
              Sumsub is the global leader in identity verification. We&rsquo;re built for the MLRO
              workbench — case management, approvals, and audit. The comparison below is honest:
              Sumsub leads on IDV breadth and global coverage. We lead on compliance workflow and
              Bahrain residency.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24 lg:px-10">
          <ComparisonTable competitor="Sumsub" rows={COMPARISON_ROWS} />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[28px] leading-[1.2] text-ink">Where Sumsub wins.</h2>
              <ul className="mt-8 space-y-6">
                <li>
                  <div className="font-medium text-ink">Global IDV coverage</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Sumsub covers 200+ countries with liveness, document match and face comparison.
                    If your users are global, Sumsub is the safer default.
                  </p>
                </li>
                <li>
                  <div className="font-medium text-ink">Biometric data</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Sumsub stores and matches biometric templates. We passthrough IDV results
                    without storing biometrics (simpler GDPR story).
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-[28px] leading-[1.2] text-ink">Where TruVis leads.</h2>
              <ul className="mt-8 space-y-6">
                <li>
                  <div className="font-medium text-ink">Compliance-first workflow</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Sumsub is API-first. We built the MLRO workbench: case queues, role-based
                    approvals, and SAR register.
                  </p>
                </li>
                <li>
                  <div className="font-medium text-ink">Bahrain residency</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                    Data lives in Bahrain (me1). Sumsub requires a custom agreement for UAE data
                    residency.
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
              The best choice depends on your stack.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              If your team needs to build custom IDV flows, Sumsub is the right choice. If you need
              a compliance workbench the MLRO can open in the morning and run cases through, TruVis
              is built for that. Many teams use both.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-demo"
                className="btn-primary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                Compare your needs
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
