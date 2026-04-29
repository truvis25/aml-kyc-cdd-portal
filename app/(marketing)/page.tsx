import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { PillarCard, type Pillar } from '@/components/marketing/PillarCard';
import { TrustBadges } from '@/components/marketing/TrustBadges';
import { CTASection } from '@/components/marketing/CTASection';

const PILLARS: Pillar[] = [
  {
    numeral: '01',
    title: 'Onboard',
    tagline: 'A branded onboarding flow your customers will actually finish.',
    bullets: [
      'Tenant-branded customer portal with multi-step flows',
      'Individual KYC and corporate KYB with append-only versioning',
      'Identity verification, liveness, OCR and face match',
      'Document upload to private storage with 15-minute signed URLs',
      'Consent capture with version, timestamp and IP — DPA evidence on one row',
    ],
  },
  {
    numeral: '02',
    title: 'Decide',
    tagline: 'Risk and cases your team can actually run.',
    bullets: [
      '3-D risk scoring — geography, PEP exposure, screening hits',
      'Sanctions and PEP screening with hit-resolution workflow',
      'Role-aware case queues for Analyst → Senior Reviewer → MLRO',
      'Approval workflow with four-eyes enforcement',
      'SAR flag as a first-class action, not an out-of-band email',
    ],
  },
  {
    numeral: '03',
    title: 'Prove',
    tagline: 'Audit, evidence and SAR — ready for the regulator.',
    bullets: [
      'Append-only, hash-chained audit log on every action',
      'Customer data versioning — never a bare UPDATE',
      'goAML-ready SAR register and JSON-L export',
      'Bahrain-resident storage, signed-URL document access',
      'No PII in application logs — sanitiser-enforced',
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      <Hero />

      {/* Quiet trust band */}
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
                title="Fines start at AED 10,000."
                body="And run to AED 5 million per violation. Excel and email are not a control."
              />
              <ProblemPoint
                index="B"
                title="Buyers off the shelf are built for engineers."
                body="Most AML platforms sell APIs to product teams. The MLRO is left building the workflow on top."
              />
              <ProblemPoint
                index="C"
                title="The audit chain has to defend itself."
                body="Inspectors ask for evidence two years later. If you can&rsquo;t prove what was decided and why, you lose the argument."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="flex items-end justify-between gap-10">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
                <span className="copper-rule" aria-hidden="true" />
                <span>What it does</span>
              </p>
              <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
                One workbench. Three jobs done right.
              </h2>
            </div>
            <Link
              href="/product"
              className="hidden items-center gap-1 text-[14px] font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline lg:inline-flex"
            >
              Full product tour <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <PillarCard key={p.title} pillar={p} />
            ))}
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* "How it works" — four-step editorial flow */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>How it works</span>
            </p>
            <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              From first click to a signed-off case.
            </h2>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Step
              number="01"
              title="Customer onboards"
              body="Tenant-branded portal collects KYC / KYB and runs identity verification end-to-end."
            />
            <Step
              number="02"
              title="System screens and scores"
              body="Sanctions and PEP screening, geography risk and 3-D risk band — every input retained."
            />
            <Step
              number="03"
              title="Analyst works the case"
              body="Hits resolved, RAI emails sent, notes captured, escalation when the band warrants it."
            />
            <Step
              number="04"
              title="MLRO signs off"
              body="Four-eyes approval, decision recorded, audit chain closes the loop. SAR if it needs one."
            />
          </ol>
        </div>
      </section>

      {/* Why TruVis — replaces the prior compare section */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 lg:px-10">
          <div className="grid items-start gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
                <span className="copper-rule" aria-hidden="true" />
                <span>Why TruVis</span>
              </p>
              <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
                The compliance layer above your stack.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft">
                We don&rsquo;t replace your IDV provider or your screening data. We sit above
                them — the case-centric workbench your MLRO opens in the morning, with the
                evidence chain your regulator will accept.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/product"
                  className="btn-secondary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
                >
                  See the product
                </Link>
                <Link
                  href="/security"
                  className="btn-secondary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
                >
                  Read the security model
                </Link>
              </div>
            </div>

            <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:col-span-7">
              <Reason
                title="Case-first, not API-first."
                body="Workbench, queues, four-eyes — designed for compliance staff, not engineers."
              />
              <Reason
                title="Audit you can defend."
                body="Append-only and hash-chained at the database. Every decision linked to every artefact."
              />
              <Reason
                title="UAE-resident by design."
                body="Bahrain region, Row Level Security on every table, MFA-required for privileged roles."
              />
              <Reason
                title="Transparent pricing."
                body="Published AED tiers, including a Starter that ships in days — not an enterprise quote."
              />
            </ul>
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

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="bg-paper px-7 py-8">
      <div className="font-display text-copper text-[26px] leading-none">{number}</div>
      <div className="mt-5 text-[15px] font-medium text-ink">{title}</div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{body}</p>
    </li>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <li className="bg-paper px-7 py-6">
      <div className="font-display text-[22px] leading-[1.2] text-ink">{title}</div>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">{body}</p>
    </li>
  );
}
