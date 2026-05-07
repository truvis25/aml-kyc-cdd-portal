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
        eyebrow="Complete audit trail"
        title="Every decision on record — permanently, and ready for a regulator."
        body="Every approval, rejection, document upload, and risk change is recorded automatically and can never be altered. When an examiner asks what happened in a case, you produce the complete file in minutes — not days."
        bullets={[
          'Permanent record of every compliance action — nothing can be changed after the fact',
          'Full case history: who decided what, when, and why',
          'goAML export for FIU submissions, with file integrity verification',
          'Seven-year retention by default, with full export for handover',
        ]}
        ctaLabel="How we handle security"
        ctaHref="/security"
        visual={<ProveVisual />}
      />

      <ProductSection
        eyebrow="AML screening"
        title="Know instantly if a customer or transaction is a risk."
        body="TruVis screens against hundreds of sanctions lists, PEP registers, and adverse media sources the moment a customer applies — and alerts you when anything changes after onboarding. Your team reviews matches inside the case, with the full customer file alongside."
        bullets={[
          'Sanctions, PEP, and adverse media screening in real time',
          'Alerts when a match appears — not on a nightly batch run',
          'Hit review inside the case: confirm, dismiss, or escalate — each action recorded',
          'Swap or add screening providers without rebuilding your workflow',
        ]}
        ctaLabel="See the screening workflow"
        ctaHref="/product"
        visual={<DecideVisual />}
        reverse
      />

      <ProductSection
        eyebrow="One connected platform"
        title="From customer onboarding to SAR filing — in one place."
        body="Replace the spreadsheet and the four separate tools. TruVis connects KYC onboarding, AML screening, risk scoring, case review, and SAR filing into one workflow. One customer record. One audit trail. One vendor to call when something needs fixing."
        bullets={[
          'UAE Pass sign-in and Emirates ID reading built in — no extra integrations',
          'Onboarding for individuals and companies, each step permanently recorded',
          'MLRO workbench: case queue, deadlines, requests for information, EDD section',
          'SAR drafting and goAML export, with tipping-off protection built in',
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
                edge="UAE Pass ✓ · goAML filing ✓ · UAE data residency ✓"
                concede="They have a wider global document library"
                href="/compare"
              />
              <CompareCard
                category="vs regional GCC suites"
                edge="API access ✓ · white-label ✓ · transparent AED pricing ✓"
                concede="They have deeper direct regulator-submission integrations today"
                href="/compare"
              />
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="See TruVis running your compliance workflow."
        body="30 minutes with your team. No slides. We walk through your onboarding, screening, and case review process — and show you exactly where TruVis fits."
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
