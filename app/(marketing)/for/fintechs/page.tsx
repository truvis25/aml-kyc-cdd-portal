import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis for Fintechs & EMIs | UAE AML Compliance',
  description:
    'TruVis helps UAE fintechs and EMIs onboard customers faster with AML compliance built in. Real-time screening, case management, and MLRO workbench — CBUAE and DFSA ready.',
};

const PAIN_POINTS: { title: string; body: string }[] = [
  {
    title: 'Your compliance team spends most of the day doing manual reviews.',
    body: 'False positives build up faster than your analysts can clear them. At 50 onboardings a day, the queue overflows before noon — and customers wait days for activation. TruVis routes only genuine exceptions to your team, so analysts focus on the cases that actually need attention.',
  },
  {
    title: 'One missed screening hit can trigger regulatory action.',
    body: 'CBUAE and DFSA examinations now include sanctions-screening spot checks. A single unresolved match is enough grounds for enforcement. TruVis screens in real time and alerts your team immediately when something changes — not at the end of the week.',
  },
  {
    title: 'Separate tools for onboarding, screening, cases, and SAR mean audit gaps.',
    body: 'When the regulator asks for the full evidence chain — from the customer\'s first document to the final approval — it shouldn\'t take a week to pull together. TruVis keeps it all connected in one place.',
  },
];

const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Instant verification results',
    body: 'Identity verification results are delivered to your platform the moment they complete. No waiting, no manual reconciliation. The result is linked to the customer record and permanently recorded.',
  },
  {
    title: 'Automatic risk decisions',
    body: 'Every customer gets a risk score based on who they are, where they operate, and their screening results. High-risk customers go to Enhanced Due Diligence automatically. Your MLRO can explain every decision to a regulator.',
  },
  {
    title: 'CBUAE and DFSA compliance workflows',
    body: 'TruVis workflows follow CBUAE and DFSA requirements: customer risk assessment, ongoing monitoring, SAR filing, and record retention. Built for examination — not adapted after the fact.',
  },
  {
    title: 'UAE Pass and Emirates ID built in',
    body: 'Customers can sign in and verify their identity with UAE Pass or Emirates ID without any extra integration. The result is recorded automatically — your compliance team doesn\'t have to do anything extra.',
  },
];

const STEPS: { i: number; t: string; d: string }[] = [
  { i: 1, t: 'Set up', d: 'Configure your document requirements, risk thresholds, and branding in the admin panel. No engineering required for the basics.' },
  { i: 2, t: 'Go live', d: 'Embed the onboarding flow or connect via API. Identity verification and AML screening are included. Most teams are live the same week.' },
  { i: 3, t: 'Review', d: 'Applications flow into your team\'s case queue. Analysts triage. Your MLRO approves. Every decision is recorded.' },
  { i: 4, t: 'Prove', d: 'Export a complete audit record for CBUAE, DFSA, or FSRA on demand. The full evidence trail is there from day one.' },
];

export default function FintechsPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>For Fintechs &amp; EMIs</span>
          </p>
          <h1 className="font-display mt-6 max-w-[24ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            Grow faster when compliance isn&rsquo;t slowing you down.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            TruVis gives UAE fintechs and EMIs a complete compliance platform — KYC onboarding,
            AML screening, case management, and SAR filing — that works from day one and holds
            up under CBUAE and DFSA examination.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Where compliance teams lose time</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
            The three problems that cost fintechs time, money, and licences.
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
            <span>What you get</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
            Built for fintech compliance teams.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-line bg-paper p-6">
                <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Getting started</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
            From trial to examination-ready in four steps.
          </h2>
          <ol className="mt-10 grid gap-4 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.i} className="rounded-2xl border border-line bg-cream p-6">
                <div className="font-display text-[32px] text-copper leading-none">{s.i}</div>
                <div className="mt-4 text-[15px] font-semibold text-ink">{s.t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CTASection
        title="See TruVis with your compliance workflow."
        body="30 minutes with your team. We walk through your onboarding and screening process and show you exactly how TruVis fits."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
