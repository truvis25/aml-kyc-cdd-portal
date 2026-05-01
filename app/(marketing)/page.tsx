import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { StatsBanner } from '@/components/marketing/StatsBanner';
import { ProductSection } from '@/components/marketing/ProductSection';
import {
  OnboardingVisual,
  DecideVisual,
  ProveVisual,
} from '@/components/marketing/ProductVisuals';
import { IndustryGrid } from '@/components/marketing/IndustryGrid';
import { IntegrationsStrip } from '@/components/marketing/IntegrationsStrip';
import { Differentiators } from '@/components/marketing/Differentiators';
import { Testimonials } from '@/components/marketing/Testimonials';
import { ResourceTeaser } from '@/components/marketing/ResourceTeaser';
import { TrustBadges } from '@/components/marketing/TrustBadges';
import { CTASection } from '@/components/marketing/CTASection';

export default function LandingPage() {
  return (
    <>
      <Hero />

      {/* Quiet trust band — verticals served */}
      <section className="border-y border-line-soft bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-7 text-[13px] text-mute sm:flex-row sm:justify-between lg:px-10">
          <span className="flex items-center gap-3">
            <span className="copper-rule" aria-hidden="true" />
            <span>Trusted by compliance teams across the UAE</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 opacity-80">
            <PartnerWordmark>DNFBP</PartnerWordmark>
            <PartnerWordmark>Tier-2 Fintech</PartnerWordmark>
            <PartnerWordmark>EMI</PartnerWordmark>
            <PartnerWordmark>CSP</PartnerWordmark>
            <PartnerWordmark>Real estate</PartnerWordmark>
            <PartnerWordmark>Law firm</PartnerWordmark>
          </div>
        </div>
      </section>

      <StatsBanner />

      {/* Problem — editorial three-up */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="grid items-start gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
                <span className="copper-rule" aria-hidden="true" />
                <span>The problem</span>
              </p>
              <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
                The bar moved. The toolkit didn&rsquo;t.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft">
                UAE Federal Decree-Law No. 10 of 2025 raised the standard for customer risk
                assessment, ongoing monitoring and SAR filing. Most compliance teams are still
                running the workflow on spreadsheets and email threads.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:col-span-7">
              <ProblemPoint
                index="A"
                title="Fines range from AED 10,000 to AED 5 million per violation."
                body="The regulator&rsquo;s first question: show me your evidence. A spreadsheet can&rsquo;t prove who decided what, when, or why. Email threads are not a control."
              />
              <ProblemPoint
                index="B"
                title="IDV and screening vendors sell to engineers."
                body="Your MLRO is left wiring them together in Zapier and Slack. There&rsquo;s no case queue, no role-aware approval gate, no forensic audit chain."
              />
              <ProblemPoint
                index="C"
                title="Two years from now, an inspector will ask: prove your decision."
                body="If your evidence is in email threads or spreadsheet comments, you lose. If you have an immutable, timestamped, hash-chained audit trail, you win."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three deep-dive product sections, alternating */}
      <ProductSection
        eyebrow="Onboard"
        title="A branded onboarding flow your customers will actually finish."
        body="Tenant-branded, multi-step, resumable. Individuals and corporates. IDV, document upload to private storage, consent capture with version, timestamp and IP &mdash; DPA evidence in one row."
        bullets={[
          'Per-tenant branding (logo + colour) on the customer portal',
          'KYC-individual and KYB-corporate forms, each step audited',
          'Embedded identity verification with liveness, OCR and face match',
          '15-minute signed URLs on every document — no caching, no leaks',
        ]}
        ctaLabel="Walk through onboarding"
        ctaHref="/product"
        visual={<OnboardingVisual />}
      />

      <ProductSection
        eyebrow="Decide"
        title="Risk and cases your team can actually run."
        body="A transparent 3-D risk model, role-aware case queues, four-eyes approvals, and SAR as a first-class action. The workbench your MLRO opens in the morning &mdash; no integration project required."
        bullets={[
          '3-D risk: geography, PEP exposure, screening hits',
          'Role-aware queues for Analyst → Senior Reviewer → MLRO',
          'Four-eyes enforcement on approvals, recorded against the case',
          'SAR flag as an action, not an out-of-band email',
        ]}
        ctaLabel="See the case workbench"
        ctaHref="/product"
        visual={<DecideVisual />}
        reverse
      />

      <ProductSection
        eyebrow="Prove"
        title="Audit, evidence and SAR &mdash; ready for the regulator."
        body="Every action lands in an append-only, hash-chained ledger. Customer data is versioned &mdash; never a bare UPDATE. SARs export as goAML XML with a SHA-256 hash bound to the audit row."
        bullets={[
          'Append-only audit_log with hash-chain integrity',
          'customer_data_versions — every revision retained',
          'goAML XML export with one click; SHA-256 in the audit row',
          'No PII in application logs — sanitiser-enforced in CI',
        ]}
        ctaLabel="Read the security model"
        ctaHref="/security"
        visual={<ProveVisual />}
      />

      <IndustryGrid />

      <IntegrationsStrip />

      <Differentiators />

      <TrustBadges />

      <Testimonials />

      <ResourceTeaser />

      {/* Comparison teaser — generic categories, no vendor names */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
                <span className="copper-rule" aria-hidden="true" />
                <span>Where we fit</span>
              </p>
              <h2 className="font-display mt-6 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
                Where we lead, and where we don&rsquo;t.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
                We&rsquo;re an MLRO workbench, not an IDV provider. We&rsquo;re a SaaS, not a
                bespoke integration. Read where that lands us versus the categories of tools
                you may already be evaluating.
              </p>
            </div>
            <div className="grid gap-3 lg:col-span-7 sm:grid-cols-2">
              <CompareCard
                category="vs global IDV platforms"
                edge="Compliance workflow + UAE residency"
                concede="They lead on global IDV breadth"
                href="/compare"
              />
              <CompareCard
                category="vs regional compliance suites"
                edge="Transparent pricing + workbench depth"
                concede="They lead on regulator-direct submissions"
                href="/compare"
              />
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}

function PartnerWordmark({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-mute">
      {children}
    </span>
  );
}

function ProblemPoint({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-paper px-7 py-7">
      <div className="flex items-baseline gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
        <span className="font-display text-copper text-[20px]">{index}</span>
        <span>Pressure point</span>
      </div>
      <h3 className="font-display mt-4 text-[24px] leading-[1.2] text-ink">{title}</h3>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function CompareCard({
  category,
  edge,
  concede,
  href,
}: {
  category: string;
  edge: string;
  concede: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-line bg-cream/40 p-6 transition-colors hover:border-copper/40 hover:bg-cream"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[12px] uppercase tracking-[0.16em] text-mute">Compare</div>
        <span aria-hidden="true" className="text-mute transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </div>
      <div className="font-display mt-1 text-[24px] leading-[1.15] text-ink">{category}</div>
      <div className="mt-5 space-y-2 text-[13.5px]">
        <div className="flex items-start gap-2 text-ink">
          <span className="text-copper">+</span>
          <span>{edge}</span>
        </div>
        <div className="flex items-start gap-2 text-mute">
          <span>&minus;</span>
          <span>{concede}</span>
        </div>
      </div>
    </Link>
  );
}
