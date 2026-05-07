import type { Metadata } from 'next';
import Link from 'next/link';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'How TruVis compares to global and regional compliance platforms',
  description:
    'TruVis vs global IDV platforms and regional GCC compliance suites. UAE Pass, goAML, hash-chained audit, white-label, API-first — compared feature by feature.',
};

const VS_GLOBAL_IDV = [
  {
    feature: 'Use case',
    truvis: 'MLRO workbench — case management, approvals, audit',
    competitor: 'Identity verification — document, liveness, biometric match',
  },
  {
    feature: 'UAE Pass integration',
    truvis: '✓ Native liveness and Emirates ID parse',
    competitor: '— (UAE Pass not supported)',
  },
  {
    feature: 'goAML export',
    truvis: '✓ goAML XML export; SAR as a first-class action',
    competitor: '— (rarely native to global IDV platforms)',
  },
  {
    feature: 'Arabic language support',
    truvis: 'Arabic UI on roadmap (Q3 2026)',
    competitor: '— (typically English-only portal)',
  },
  {
    feature: 'Data residency',
    truvis: '✓ UAE/Bahrain (me1) — data never leaves the GCC by default',
    competitor: 'Global — typically US/EU AWS or GCP infrastructure',
  },
  {
    feature: 'Case queue & MLRO workbench',
    truvis: '✓ Role-aware queues, four-eyes approvals, SLA tracking',
    competitor: '— (API-centric; no MLRO queue)',
  },
  {
    feature: 'Audit trail',
    truvis: '✓ Append-only, hash-chained, SHA-256 tamper-detectable',
    competitor: 'Webhook + event logs — not always append-only',
  },
  {
    feature: 'AML screening',
    truvis: '✓ 235+ lists, real-time, push alerts on every update',
    competitor: 'Some platforms native, others via partner',
  },
  {
    feature: 'White-label multi-tenant',
    truvis: '✓ Per-tenant branding, domain, and configuration',
    competitor: '— (typically single-tenant or shared branding)',
  },
  {
    feature: 'Pricing',
    truvis: 'Transparent AED tiers — published, no NDA required',
    competitor: 'Per-verification, sales-led contract',
  },
  {
    feature: 'Self-serve trial',
    truvis: '✓ 14-day free trial, full Compliance Suite, no card',
    competitor: '— (demo + contract required)',
  },
];

const VS_REGIONAL_SUITE = [
  {
    feature: 'UAE regulatory coverage',
    truvis: '✓ CBUAE, DFSA, FSRA, VARA, UAE PDPL — native',
    competitor: '✓ UAE regulatory coverage',
  },
  {
    feature: 'UAE Pass / Emirates ID',
    truvis: '✓ UAE Pass liveness and Emirates ID parse',
    competitor: '✓ Native',
  },
  {
    feature: 'goAML export',
    truvis: '✓ goAML XML export with audit hash bound to SAR row',
    competitor: '✓ Direct API integration where supported',
  },
  {
    feature: 'Hash-chained audit trail',
    truvis: '✓ Append-only, SHA-256 hash-chained, tamper-detectable',
    competitor: 'Audit log per platform — append-only not always enforced',
  },
  {
    feature: 'API-first architecture',
    truvis: '✓ API-first; embed onboarding widget in an afternoon',
    competitor: 'Monolithic — limited API surface for integration',
  },
  {
    feature: 'White-label multi-tenant',
    truvis: '✓ Full white-label with per-tenant branding and config',
    competitor: '— (typically no white-label option)',
  },
  {
    feature: 'Transparent SaaS pricing',
    truvis: '✓ AED tiers published — Foundations from AED 2,500/month',
    competitor: 'Sales call required',
  },
  {
    feature: 'Self-serve trial',
    truvis: '✓ 14-day trial, no card, full Compliance Suite access',
    competitor: '— (typically sales-led)',
  },
  {
    feature: 'Case queue & four-eyes approvals',
    truvis: '✓ Role-aware queues, four-eyes enforced at database layer',
    competitor: '✓ Workflow + queues',
  },
  {
    feature: 'Data residency',
    truvis: '✓ UAE/Bahrain (me1) — Vercel and Supabase',
    competitor: 'Varies — not always UAE-resident',
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
              <span>How TruVis compares</span>
            </p>
            <h1 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              How TruVis compares to global and regional compliance platforms.
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
              Teams evaluating TruVis are usually also looking at two categories: global
              identity-verification platforms (broad document library, global reach) and
              regional GCC compliance suites (UAE regulatory alignment). TruVis is the platform
              that gives you both — UAE-native and global-grade, without the trade-off.
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
              vs global IDV platforms
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
              Global IDV platforms have broad document libraries, deepfake detection, and
              mobile SDKs. They are engineering-led products with global reach. What they lack:
              UAE Pass integration, goAML support, Arabic, and UAE data residency. They are
              also not compliance workbenches — there is no MLRO queue, no four-eyes approval,
              no SAR register.
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
              Regional GCC suites offer UAE regulatory alignment — UAE Pass, Emirates ID, goAML
              templates. TruVis shares that orientation and adds what regional suites typically
              lack: API-first architecture, full white-label multi-tenancy, hash-chained
              append-only audit trail, and transparent published pricing in AED.
            </p>
          </div>
          <div className="mt-10">
            <ComparisonTable competitor="Regional GCC suite" rows={VS_REGIONAL_SUITE} />
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-[32px] leading-[1.2] text-ink">
              UAE-native + global-grade. That is the TruVis position.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              If you need a broad global document library with mobile SDKs, a global IDV
              platform covers that — and you can run TruVis above it for the MLRO workbench
              and audit. If you need UAE regulatory alignment with an API-first architecture,
              white-label capability, and a hash-chained audit trail you can hand to CBUAE or
              DFSA on demand, that is TruVis.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-demo"
                className="btn-primary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                Book a Demo
              </Link>
              <Link
                href="/product"
                className="btn-secondary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                See the platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="See TruVis against your exact requirements."
        body="Reserve your demo — 30 minutes, no pitch deck, your workflow our focus."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
