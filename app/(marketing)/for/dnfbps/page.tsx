import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis for UAE DNFBPs | AML Compliance',
  description:
    'AML compliance for UAE real estate agents, gold dealers, VASPs, and CSPs. Beneficial ownership mapping, cash transaction monitoring, SAR filing, and goAML export — built for CBUAE and EMLO examination.',
};

const PAIN_POINTS: { title: string; body: string }[] = [
  {
    title: 'CBUAE and EMLO now examine DNFBPs with the same rigour as banks — but most tools are built for banks.',
    body: 'The Ministry of Economy and CBUAE have issued specific DNFBP AML guidance. Generic compliance tools do not map to DNFBP-specific risk categories, transaction thresholds, or beneficial ownership requirements. TruVis is built for DNFBP workflows from the ground up.',
  },
  {
    title: 'Cash transactions above AED 55,000 trigger STR obligations — manual tracking fails at volume.',
    body: 'The AED 55,000 threshold applies per transaction and per customer across a relationship. Manual spreadsheet tracking misses aggregation. TruVis flags threshold breaches automatically and pre-fills the goAML Suspicious Transaction Report form.',
  },
  {
    title: 'Tracing beneficial ownership through complex corporate structures takes days, not minutes.',
    body: 'Mapping UBO chains through holding entities, different jurisdictions, and nominee arrangements is the highest-risk gap in DNFBP compliance. TruVis maps the corporate hierarchy and records each verification step in the case file.',
  },
];

const SEGMENTS: { name: string; pain: string; truvisFit: string }[] = [
  {
    name: 'Real Estate',
    pain: 'Source-of-funds checks under MoE supervision, beneficial owner mapping for corporate buyers, ongoing PEP screening on landlords and tenants.',
    truvisFit: 'Company onboarding with full ownership tree, sanctions and PEP screening, document evidence in the case file, cash transaction risk flags.',
  },
  {
    name: 'Gold & Precious Metals',
    pain: 'AED 55,000 cash-transaction threshold, walk-in customers, repeat-buyer monitoring, keeping identification evidence on file.',
    truvisFit: 'Quick individual onboarding, automatic AED 55,000 STR trigger, goAML pre-fill, complete audit record that survives a thematic inspection.',
  },
  {
    name: 'Crypto / VASPs (VARA)',
    pain: 'VARA Travel Rule compliance, VASP counterparty due diligence, ongoing transaction monitoring, SAR obligations.',
    truvisFit: 'VARA-aligned risk questionnaire, real-time screening against hundreds of sanctions lists, SAR drafting with goAML XML export.',
  },
  {
    name: 'CSPs & TCSPs',
    pain: 'UBO tracing, multi-entity structures, nominee arrangements, constant change-of-circumstance updates.',
    truvisFit: 'Company onboarding with full corporate ownership tree — every UBO change is recorded and the risk score updated automatically.',
  },
];

export default function DnfbpsPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>For DNFBPs</span>
          </p>
          <h1 className="font-display mt-6 max-w-[26ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            AML compliance for UAE real estate, gold dealers, and VASPs.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            CBUAE and EMLO now examine DNFBPs with the same rigour as banks. TruVis gives you
            a defensible onboarding, screening, and audit workflow built specifically for FATF
            DNFBP categories — not adapted from a bank product.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>The pressure DNFBPs face today</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
            Three compliance challenges every DNFBP needs to solve.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PAIN_POINTS.map((p) => (
              <article key={p.title} className="rounded-2xl border border-line bg-cream p-6">
                <h3 className="text-[15px] font-semibold leading-snug text-ink">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>By DNFBP vertical</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
            Built for your sector, not adapted from another one.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {SEGMENTS.map((s) => (
              <article key={s.name} className="rounded-2xl border border-line bg-paper p-6">
                <h3 className="text-[16px] font-semibold text-ink">{s.name}</h3>
                <p className="mt-3 text-[14px]">
                  <span className="font-semibold text-ink-soft">The challenge: </span>
                  <span className="text-ink-soft">{s.pain}</span>
                </p>
                <p className="mt-3 text-[14px]">
                  <span className="font-semibold text-copper">TruVis: </span>
                  <span className="text-ink-soft">{s.truvisFit}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
                <span className="copper-rule" aria-hidden="true" />
                <span>DNFBP-specific features</span>
              </p>
              <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
                Included in every tier.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                TruVis is not a bank compliance tool adapted for DNFBPs. The beneficial
                ownership mapping, cash transaction monitoring, and goAML SAR pre-fill are
                built in — not add-ons.
              </p>
            </div>
            <ul className="rounded-2xl border border-line bg-cream p-6">
              {[
                'Beneficial ownership mapping — trace UBO chains through multiple corporate layers',
                'Cash transaction monitoring — AED 55,000 threshold triggers an automatic alert',
                'goAML SAR pre-fill — reduce SAR drafting time significantly',
                'DNFBP risk questionnaire — MoE and CBUAE-aligned customer risk assessment',
                'Risk scores update automatically whenever customer circumstances change',
                'Every risk decision recorded in the case file — defensible under examination',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 py-2 text-[14px] text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CTASection
        title="See TruVis for your DNFBP vertical."
        body="30 minutes, no pitch deck. Tell us your sector and we&rsquo;ll show you exactly how TruVis fits your compliance workflow."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
