import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'TruVis for Fintechs',
  description:
    'TruVis for UAE fintechs, EMIs and PSPs — a regulator-ready compliance workbench that complements your IDV stack and gives your MLRO a defensible audit trail.',
};

const REASONS: { title: string; body: string }[] = [
  {
    title: 'You already have IDV. You need a workbench.',
    body: 'Sumsub, Onfido, Persona — pick your IDV. TruVis sits above it. The case-management, four-eyes-approval and audit layer most fintechs build in-house, available off the shelf.',
  },
  {
    title: 'Your MLRO is a person, not a Slack channel.',
    body: 'TruVis is the only product they need to open in the morning. Queues, alerts, RAI emails, decisions — all inside one tenant-scoped, MFA-required workbench.',
  },
  {
    title: 'The regulator wants evidence, not screenshots.',
    body: 'audit_log is append-only, hash-chained and DB-enforced. Customer data versioning means every field change is a row, not an overwrite. Export to JSON-L on demand.',
  },
  {
    title: 'Bahrain region by default.',
    body: 'Vercel me1 + Supabase me1. Your customer data and audit log do not leave the GCC for compute or storage without your written instruction.',
  },
  {
    title: 'Predictable cost.',
    body: 'AED tiers from AED 1,500 / month. Verifications are passed-through at our wholesale rate during early-access, and we bundle into a fixed per-verification figure once volume stabilises.',
  },
];

export default function FintechsPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            For Fintechs &amp; EMIs
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            The compliance layer above your IDV stack.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            UAE fintechs are stuck between Sumsub-style IDV APIs (great for engineers, useless for
            MLROs) and full-fat enterprise compliance suites (overkill, opaque pricing). TruVis is
            the workbench in between.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {REASONS.map((r) => (
            <article key={r.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{r.title}</h3>
              <p className="mt-3 text-sm text-gray-700">{r.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            What an EMI launch looks like on TruVis
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-4">
            {[
              { i: 1, t: 'Sandbox', d: 'Spin up a sandbox tenant. Configure document types, risk thresholds and branding.' },
              { i: 2, t: 'IDV wired', d: 'Drop your Sumsub keys in. Onboarding flow renders the IDV widget end-to-end.' },
              { i: 3, t: 'Cases live', d: 'Onboardings flow into case queues; analysts triage; MLRO approves under four-eyes.' },
              { i: 4, t: 'Evidence', d: 'Audit JSON-L export ready for your CBUAE / SCA submission cycle.' },
            ].map((s) => (
              <li key={s.i} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Step {s.i}
                </div>
                <div className="mt-1 text-base font-semibold text-gray-900">{s.t}</div>
                <p className="mt-2 text-sm text-gray-700">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CTASection
        title="See TruVis with your IDV stack."
        body="Bring your Sumsub or Onfido sandbox. We will wire it in on the call."
      />
    </>
  );
}
