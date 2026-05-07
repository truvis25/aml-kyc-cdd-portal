import type { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Security & Data Residency | TruVis',
  description:
    'TruVis keeps your customer data in the UAE, enforces staff access controls, and maintains a permanent record of every compliance decision — ready for regulator review.',
};

const PRINCIPLES: { title: string; body: string; detail?: string[] }[] = [
  {
    title: 'Your data stays in the UAE',
    body:
      'TruVis hosts all customer data, audit records, and documents within UAE infrastructure. We do not route your data through EU or US servers by default — meeting UAE data residency expectations under the PDPL and supporting CBUAE, DFSA, and FSRA examination requirements.',
    detail: [
      'All data hosted in Bahrain (GCC region) — not EU or US',
      'No cross-border data transfers without your explicit written instruction',
      'Meets UAE Federal Decree-Law No. 45 of 2021 (UAE PDPL) requirements',
      'Supports CBUAE, DFSA, FSRA, and VARA data governance obligations',
    ],
  },
  {
    title: 'Only the right people see the right things',
    body:
      'Every member of your compliance team has a defined role — Analyst, Senior Reviewer, Compliance Officer, MLRO, or Admin. Each role sees only the cases, reports, and actions they are authorised for. MFA is required for anyone who can approve cases or file SARs.',
    detail: [
      'Seven permission levels — from read-only viewer to platform administrator',
      'MFA required for case approvers, SAR filers, and administrators',
      'SAR reports visible only to MLRO and Compliance Officer — tipping-off protection built in',
      'All login attempts and permission denials permanently recorded',
    ],
  },
  {
    title: 'A permanent record that cannot be changed',
    body:
      'Every compliance action — approval, rejection, document upload, risk decision — is permanently recorded and cannot be altered or deleted after the fact. When a regulator asks what happened in a case, you can produce a complete, timestamped record in minutes.',
    detail: [
      'Every decision permanently recorded — nothing can be changed after the fact',
      'Complete case history: who did what, when, and why',
      'Customer record versioning — see every change to a customer profile over time',
      'Seven-year retention by default',
      'Full case file export for regulator handover',
    ],
  },
  {
    title: 'Documents stored securely',
    body:
      'Customer documents — passports, Emirates IDs, utility bills — are stored in private, encrypted vaults. Staff access them through time-limited links that expire automatically. Documents are never publicly accessible.',
    detail: [
      'Documents stored in encrypted private storage — no public access',
      'All data encrypted at rest and in transit',
      'Access links expire automatically after a short window',
      'Document access recorded in the audit trail',
    ],
  },
  {
    title: 'Certifications and third-party testing',
    body:
      'TruVis undergoes annual independent penetration testing. We are pursuing SOC 2 Type II certification, with ISO 27001 planned for 2026. Pen-test reports are available to Enterprise customers under NDA.',
    detail: [
      'Annual third-party penetration test — application, API, and infrastructure scope',
      'SOC 2 Type II — audit in progress; report available under NDA to Enterprise customers',
      'ISO 27001 — planned 2026',
      'Security findings remediated within five business days',
    ],
  },
  {
    title: 'Breach notification within 72 hours',
    body:
      'In the event of a confirmed personal data breach, TruVis notifies affected customers within 72 hours of confirmation — in line with UAE PDPL and GDPR obligations. We document what happened, what data was affected, and what we did about it.',
    detail: [
      '72-hour breach notification SLA (UAE PDPL and GDPR)',
      'Notification includes: data categories affected, approximate record count, remedial steps',
      'Security disclosures: security@truvis.ae',
      'Coordinated disclosure requested before publishing any vulnerability details',
    ],
  },
];

const SUB_PROCESSORS_OVERVIEW: { category: string; purpose: string }[] = [
  { category: 'Data storage and authentication', purpose: 'Customer data, audit records, and document storage — UAE region' },
  { category: 'Application delivery', purpose: 'Platform hosting and edge routing — UAE region' },
  { category: 'Email notifications', purpose: 'Review requests, approvals, and operational alerts sent to your team' },
  { category: 'Sanctions and PEP screening', purpose: 'Watchlist data for AML screening checks' },
  { category: 'Identity verification', purpose: 'Document reading, liveness checks, and face matching during onboarding' },
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Security &amp; Data Residency</span>
          </p>
          <h1 className="font-display mt-6 max-w-[22ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            Built to pass a regulator&rsquo;s examination.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            When a CBUAE, DFSA, or FSRA examiner asks to see your data governance, access
            controls, and decision audit — TruVis gives you the answers, not a scramble.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-line bg-cream p-6">
                <h2 className="text-[16px] font-semibold text-ink">{p.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{p.body}</p>
                {p.detail && (
                  <ul className="mt-4 space-y-1.5">
                    {p.detail.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-[13px] text-ink-soft">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" aria-hidden="true" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-line bg-cream p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-semibold text-ink">Third-party services we use</h2>
              <Link href="/legal/sub-processors" className="text-[13px] text-copper hover:underline">
                Full list →
              </Link>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              We disclose every service that processes your customer data. The complete list,
              including the location and purpose of each, is on our legal page.
            </p>
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {SUB_PROCESSORS_OVERVIEW.map((s) => (
                <li key={s.category} className="flex items-baseline justify-between gap-4 py-3 text-[13px]">
                  <span className="font-medium text-ink">{s.category}</span>
                  <span className="text-right text-ink-soft">{s.purpose}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-cream p-6">
            <h2 className="text-[16px] font-semibold text-ink">Found a security issue?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              Email{' '}
              <a href="mailto:security@truvis.ae" className="text-copper hover:underline">
                security@truvis.ae
              </a>
              . We acknowledge within one business day and share a remediation timeline within five.
              Please coordinate disclosure with us before publishing any details.
            </p>
          </div>
        </div>
      </section>

      <CTASection
        title="Questions about data residency or access controls?"
        body="Bring your security questionnaire or your regulator&rsquo;s checklist. We&rsquo;ll walk through every point on a 30-minute call."
        primaryLabel="Book a Demo"
        secondaryLabel="Read the DPA"
        secondaryHref="/legal/dpa"
      />
    </>
  );
}
