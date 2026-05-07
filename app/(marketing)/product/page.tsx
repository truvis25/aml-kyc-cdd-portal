import type { Metadata } from 'next';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Product | TruVis',
  description:
    'TruVis brings KYC onboarding, AML screening, case management, SAR filing, and a full audit trail into one compliance platform built for UAE-regulated firms.',
};

const MODULES: {
  eyebrow: string;
  title: string;
  body: string;
  features: string[];
}[] = [
  {
    eyebrow: 'KYC & KYB Onboarding',
    title: 'A smooth onboarding your customers will actually finish.',
    body: 'Guide individuals and companies through identity verification, document upload, and consent — all under your brand. Every step is recorded automatically so your compliance team never has to ask what happened.',
    features: [
      'Digital onboarding for individuals (KYC) and companies (KYB) in one place',
      'UAE Pass sign-in and Emirates ID reading built in — no extra integrations needed',
      'Branded portal — your logo, your colours, your domain',
      'Customers can pause and return where they left off',
      'Consent recorded with date, time, and version — ready for UAE PDPL review',
      'Documents stored securely and only accessible to authorised staff',
    ],
  },
  {
    eyebrow: 'AML Screening',
    title: 'Know immediately if a customer is on a watchlist.',
    body: 'TruVis screens every customer against sanctions lists, politically exposed person registers, and adverse media the moment they apply. If something changes after onboarding, you hear about it straight away — not at the end of the week.',
    features: [
      'Sanctions, PEP, and adverse media screening in real time',
      'Alerts fire when a match appears — not on a nightly batch schedule',
      'Compliance officers review, confirm, or dismiss hits directly inside the case',
      'Screening providers are swappable — keep your existing vendor if you prefer',
      'Full history of every screening result kept permanently',
    ],
  },
  {
    eyebrow: 'Risk Scoring',
    title: 'Automatic risk ratings, calibrated to your firm.',
    body: 'Every customer gets a risk score based on who they are, where they operate, and what they do. High-risk customers are automatically routed to Enhanced Due Diligence. Your thresholds, your risk appetite — configured once and applied consistently.',
    features: [
      'Three-dimension risk model: customer type, geographic risk, activity risk',
      'Configurable thresholds — adjust risk bands to match your risk appetite',
      'High-risk customers automatically escalated to EDD review',
      'Risk scores recalculated when circumstances change',
      'Risk rationale recorded alongside the score for every customer',
    ],
  },
  {
    eyebrow: 'Case Management & MLRO Workbench',
    title: 'The workspace your MLRO opens every morning.',
    body: 'Cases flow through a structured review queue — analyst, senior reviewer, MLRO — with no case closing until the right people have signed off. Your MLRO has one screen for everything: open cases, pending approvals, SAR drafts, and alerts.',
    features: [
      'Role-based queues — analysts see their cases, MLROs see everything',
      'Four-eyes approval enforced — two sign-offs required before any case closes',
      'Enhanced Due Diligence (EDD) section for high-risk customers',
      'Request for additional information (RAI) sent directly from the case',
      'SLA tracking — see at a glance which cases are approaching their deadline',
      'Full case history: every comment, every decision, every document',
    ],
  },
  {
    eyebrow: 'SAR Filing',
    title: 'File Suspicious Activity Reports without the paperwork.',
    body: 'Draft, review, and submit Suspicious Activity Reports inside TruVis. Export in goAML XML format for the UAE FIU. Only your MLRO and Compliance Officer can see SAR activity — protecting your firm from tipping-off risk automatically.',
    features: [
      'SAR drafting workspace built into the case',
      'goAML XML export — ready to submit to the UAE Financial Intelligence Unit',
      'SAR register to track all filed and pending reports',
      'SAR access restricted to MLRO and Compliance Officer — analysts cannot see them',
      'Every SAR action permanently recorded for regulator review',
    ],
  },
  {
    eyebrow: 'Audit Trail & Reporting',
    title: 'Pull a complete case file in minutes, not days.',
    body: 'Every decision, document, and approval is permanently recorded and can never be changed or deleted. When a regulator asks for documentation, you export a complete case file — every action in chronological order, with timestamps and staff names.',
    features: [
      'Permanent record of every compliance decision — nothing can be altered after the fact',
      'Complete case file export for regulator review or internal audit',
      'Customer data history — see every change to a customer record over time',
      'goAML XML export for FIU submissions',
      'Seven-year retention by default',
      'Role-based access to reports — staff only see what they are authorised to view',
    ],
  },
];

export default function ProductPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>The platform</span>
          </p>
          <h1 className="font-display mt-6 max-w-[24ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            Every compliance workflow your team runs — in one place.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Most compliance teams manage KYC, screening, cases, and SAR filing across three or four
            separate tools. TruVis brings them together with a shared customer record, a single
            audit trail, and one vendor to call.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24 lg:px-10">
          <div className="space-y-20">
            {MODULES.map((m, i) => (
              <article key={m.eyebrow} className="grid items-start gap-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-copper">
                    <span className="font-display">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-mute">/</span>
                    <span>{m.eyebrow}</span>
                  </p>
                  <h2 className="font-display mt-4 text-[28px] leading-[1.15] text-ink sm:text-[32px]">
                    {m.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{m.body}</p>
                </div>
                <ul className="rounded-2xl border border-line bg-cream p-6 lg:col-span-7">
                  {m.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 py-2 text-[14px] text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="See how TruVis fits your team."
        body="30 minutes, no slides. Tell us how your compliance workflow runs today and we'll show you exactly where TruVis fits."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
