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
                CBUAE, DFSA, FSRA, and VARA now examine compliance programmes with the same
                rigour as full banking inspections. Most regulated firms are still stitching
                together four vendors and a spreadsheet to keep up.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:col-span-7">
              <ProblemPoint
                index="A"
                title="Manual KYC reviews eat your compliance team&rsquo;s week."
                body="False positives flood your analyst queue. Each manual review takes 20 minutes. At 50 onboardings a day, your team is permanently behind — and customer activation slows to match."
              />
              <ProblemPoint
                index="B"
                title="One missed screening hit means regulatory action."
                body="CBUAE and DFSA examinations now include transaction sampling and sanction-screening spot checks. A single unresolved hit is sufficient grounds for enforcement proceedings."
              />
              <ProblemPoint
                index="C"
                title="Stitching four vendors creates audit gaps."
                body="IDV here, screening there, cases in a spreadsheet, SAR by email. When the regulator asks for the full evidence chain, none of it links. TruVis closes the gap."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three deep-dive product sections, alternating */}
      <ProductSection
        eyebrow="Audit-grade backbone"
        title="Append-only, hash-chained audit log. Every decision, proven untampered."
        body="Every compliance action — onboarding submission, screening hit, risk score, approval, SAR flag — lands in an immutable ledger. Altering a row breaks the SHA-256 chain and is forensically detectable."
        bullets={[
          'Append-only audit_log with hash chain: each row commits to the previous row',
          'Customer data versioning — every field change is a new row, never overwritten',
          'goAML XML export bound to audit row with hash — regulator verifies file integrity',
          '7-year retention by default; JSON-L export for regulator handover',
        ]}
        ctaLabel="See the security model"
        ctaHref="/security"
        visual={<ProveVisual />}
      />

      <ProductSection
        eyebrow="Real-time AML screening"
        title="235+ sanctions lists. PEP registers. Adverse media. Under 150ms."
        body="Screen customers and counterparties in real time against the world&rsquo;s leading watchlists. Push alerts fire on every list update — not nightly batch. Hit resolution runs inside the case, with full audit trail."
        bullets={[
          '235+ sanctions lists, PEP registers, and adverse media sources',
          'Sub-150ms average latency — screening completes before the onboarding page loads',
          'Push alerts on every watchlist update, not nightly batch',
          'Hit resolution workflow: confirm, dismiss, or escalate — each action recorded',
        ]}
        ctaLabel="See the screening workflow"
        ctaHref="/product"
        visual={<DecideVisual />}
        reverse
      />

      <ProductSection
        eyebrow="One platform, end-to-end"
        title="KYC onboarding, AML screening, case management, SAR filing. One workflow."
        body="Replace five point solutions with one. UAE Pass liveness, Emirates ID parse, multi-step resumable onboarding, real-time screening, role-aware case queues, four-eyes approvals, SAR drafting with goAML XML export — all in one data model with one audit trail."
        bullets={[
          'UAE Pass liveness and Emirates ID parse out of the box',
          'KYC-individual and KYB-corporate onboarding — each step audited',
          'MLRO workbench: case queue, SLA tracking, RAI, escalation, EDD section',
          'SAR drafting with goAML XML export and tipping-off masking enforced at schema level',
        ]}
        ctaLabel="See the full platform"
        ctaHref="/product"
        visual={<OnboardingVisual />}
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
                <span>How TruVis compares</span>
              </p>
              <h2 className="font-display mt-6 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
                UAE-native and global-grade — not a trade-off.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
                Global IDV platforms give you document breadth — but no UAE Pass, no goAML,
                no Arabic. Regional suites give you regulator alignment — but monolithic, no
                white-label, no API. TruVis gives you both.
              </p>
            </div>
            <div className="grid gap-3 lg:col-span-7 sm:grid-cols-2">
              <CompareCard
                category="vs global IDV platforms"
                edge="UAE Pass ✓ · goAML native ✓ · UAE data residency ✓"
                concede="They lead on global document library breadth"
                href="/compare"
              />
              <CompareCard
                category="vs regional GCC suites"
                edge="API-first ✓ · white-label ✓ · hash-chained audit ✓"
                concede="They lead on direct regulator-submission integrations"
                href="/compare"
              />
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="CBUAE-examination-ready in 30 days — speak to our Gulf compliance team."
        body="Reserve your demo — 30 minutes, no pitch deck, your workflow our focus."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
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
