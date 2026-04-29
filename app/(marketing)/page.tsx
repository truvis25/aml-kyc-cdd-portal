import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { PillarCard, type Pillar } from '@/components/marketing/PillarCard';
import { TrustBadges } from '@/components/marketing/TrustBadges';
import { CTASection } from '@/components/marketing/CTASection';

const PILLARS: Pillar[] = [
  {
    title: 'Onboard',
    tagline: 'KYC, KYB and IDV in one branded flow.',
    bullets: [
      'Tenant-branded customer portal',
      'Individual + corporate forms with append-only versioning',
      'IDV passthrough (Sumsub) and signed-URL document upload',
      'Consent capture with regulatory-grade evidence',
    ],
  },
  {
    title: 'Decide',
    tagline: 'Risk and cases your team can actually run.',
    bullets: [
      '3-D risk scoring (geography, PEP, screening hits)',
      'ComplyAdvantage sanctions + PEP screening, hit resolution',
      'Role-aware case queues for Analyst → MLRO',
      'Approval workflows with four-eyes enforcement',
    ],
  },
  {
    title: 'Prove',
    tagline: 'Audit, evidence and SAR — ready for the regulator.',
    bullets: [
      'Append-only, hash-chained audit_log on every action',
      'Customer data versioning — never a bare UPDATE',
      'goAML-ready SAR register and JSON-L export',
      'Bahrain-resident storage with signed-URL access',
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      <Hero />

      {/* Problem strip */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <ProblemPoint
              title="The 2025 Decree-Law tightened the rules"
              body="UAE Federal Decree-Law No. 10 of 2025 and Cabinet Resolution No. 134 of 2025 raised the bar for customer risk assessment, ongoing monitoring and SAR filing — across DNFBPs and licensed financial institutions."
            />
            <ProblemPoint
              title="Fines start at AED 10,000 — and run to AED 5M"
              body="Per violation. Excel and email are not a control. Regulators expect repeatable, evidenced workflows that survive a two-year-old audit."
            />
            <ProblemPoint
              title="Off-the-shelf tools are built for engineers"
              body="Most AML platforms sell APIs to product teams. TruVis is built for the people on the hook — MLROs, Compliance Officers and Analysts — with workflows, not webhooks."
            />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              One workbench. Three jobs done right.
            </h2>
            <p className="mt-3 text-gray-700">
              TruVis covers the full onboarding-to-decision flow with the controls regulators expect
              — and none of the engineering lift compliance teams resent.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <PillarCard key={p.title} pillar={p} />
            ))}
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Comparison teaser */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                We&apos;re not Sumsub. We&apos;re not Azakaw.
              </h2>
              <p className="mt-3 text-gray-700">
                Sumsub sells global ID verification to product teams. Azakaw sells UAE-deep
                onboarding with goAML hooks. TruVis sells the layer above both — the case-centric,
                role-aware compliance workbench your MLRO actually runs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/compare/sumsub"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  See vs Sumsub
                </Link>
                <Link
                  href="/compare/azakaw"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  See vs Azakaw
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Why MLROs pick TruVis
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-800">
                <li className="flex gap-2">
                  <span aria-hidden="true">→</span>
                  <span>
                    <strong>Case-first, not API-first.</strong> Workbench, queues, four-eyes — built
                    for compliance staff, not engineers.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">→</span>
                  <span>
                    <strong>Audit you can defend.</strong> Append-only hash-chained log. Every
                    decision linked to every artefact.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">→</span>
                  <span>
                    <strong>UAE-resident by design.</strong> Bahrain region, RLS-enforced tenancy,
                    MFA-required roles.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">→</span>
                  <span>
                    <strong>Transparent pricing.</strong> Published tiers. No mystery enterprise
                    quote to get started.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Design-partner strip */}
      <section className="border-y border-gray-200 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
            Trusted by compliance teams across the UAE
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 opacity-70 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs uppercase tracking-wider text-gray-400"
              >
                Design partner
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            Logos placeholder during early-access — real partner brands appear here as cohorts close.
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}

function ProblemPoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-700">{body}</p>
    </div>
  );
}
