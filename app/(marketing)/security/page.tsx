import type { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Security & Data Residency — Built for regulated institutions',
  description:
    'TruVis security: SOC 2 Type II, ISO 27001 planned, UAE PDPL compliant. AES-256 at rest, TLS 1.3 in transit, UAE data residency (Bahrain/me1), hash-chained audit log, MFA enforced, 7 RBAC roles.',
};

const PRINCIPLES: { title: string; body: string; detail?: string[] }[] = [
  {
    title: 'Certifications',
    body:
      'TruVis is pursuing SOC 2 Type II certification. ISO 27001 certification is planned for 2026. TruVis is compliant with UAE Federal Decree-Law No. 45 of 2021 (UAE PDPL) and supports customers in their GDPR obligations as a processor.',
    detail: [
      'SOC 2 Type II — audit in progress; report available to Enterprise customers under NDA',
      'ISO 27001 — planned certification 2026',
      'UAE PDPL (Federal Decree-Law No. 45 of 2021) — compliant',
      'GDPR — processor obligations fulfilled via DPA',
    ],
  },
  {
    title: 'UAE data residency',
    body:
      'Your data stays in the UAE. Hosted on Vercel region me1 (Bahrain) and Supabase region me1 (Bahrain). Never routed through EU or US infrastructure by default. Cross-region replication requires your written instruction.',
    detail: [
      'Vercel App Router region: me1 (Bahrain)',
      'Supabase Postgres + Auth + Storage: me1 (Bahrain)',
      'No cross-region replicas by default — opt-in only with written instruction',
      'UAE PDPL cross-border transfer restrictions respected',
    ],
  },
  {
    title: 'Encryption',
    body:
      'All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Key management is handled via cloud KMS. Customer documents are stored in private buckets with no public read access.',
    detail: [
      'AES-256 encryption at rest — Supabase-managed, platform-enforced',
      'TLS 1.3 in transit — all connections, no downgrades',
      'Cloud KMS for encryption key management',
      'Customer documents: private storage buckets, 15-minute signed URLs, never cached',
    ],
  },
  {
    title: 'Access control — MFA enforced, 7 RBAC roles',
    body:
      'MFA is enforced for all roles with case-approval or SAR-queue access. RBAC is applied at two layers: JWT middleware and API route. No privilege escalation is possible — least-privilege is the default.',
    detail: [
      'TOTP MFA enforced for MLRO, Compliance Officer, Tenant Admin, Senior Reviewer',
      '7 role levels: Super Admin, Tenant Admin, MLRO, Compliance Officer, Senior Reviewer, Analyst, Viewer',
      'RBAC enforced twice: JWT middleware (deny fast) and API route (deny late)',
      'Least-privilege default — every role sees only the cases and actions it needs',
      'Failed sign-in attempts and permission denials logged to the hash-chained audit trail',
    ],
  },
  {
    title: 'Penetration testing',
    body:
      'Annual third-party penetration test conducted by an independent security firm. Results are available under NDA to Enterprise customers. No public bug bounty programme is currently operated.',
    detail: [
      'Annual third-party penetration test — scope: application, API, and infrastructure',
      'Pen-test report available under NDA to Enterprise customers',
      'Remediation timeline published within 5 business days of confirmed finding',
    ],
  },
  {
    title: 'Incident response — 72-hour breach notification',
    body:
      'TruVis notifies customers of confirmed personal-data breaches within 72 hours of confirmation, in accordance with UAE PDPL and GDPR obligations. The dedicated security contact for disclosures and incidents is security@truvis.io.',
    detail: [
      '72-hour breach notification SLA (UAE PDPL and GDPR)',
      'Breach notification includes: categories of data, approximate record count, likely consequences, remedial steps',
      'Dedicated security contact: security@truvis.io',
      'Coordinated disclosure requested before public publication of any vulnerability',
    ],
  },
  {
    title: 'Audit-grade backbone',
    body:
      'Every compliance action lands in an immutable, hash-chained ledger. UPDATE and DELETE are forbidden at the database layer. Altering a row breaks the SHA-256 chain — tampering is immediately detectable.',
    detail: [
      'Append-only audit_log: UPDATE/DELETE blocked by database trigger, no exceptions',
      'SHA-256 hash chain: each row commits to the previous row',
      'Customer data versioning: every field change is a new append-only row, never overwritten',
      '7-year retention by default; JSON-L export for regulator handover',
      'IP addresses masked to /24 before storage — geographic data only',
    ],
  },
];

const SUB_PROCESSORS_OVERVIEW: { category: string; purpose: string }[] = [
  { category: 'Database, auth and storage', purpose: 'Tenant data, audit log and file storage in region me1 (Bahrain)' },
  { category: 'Application hosting', purpose: 'Edge runtime in region me1 (Bahrain)' },
  { category: 'Transactional email', purpose: 'RAI, decision and operational notifications' },
  { category: 'Sanctions and PEP screening', purpose: 'Watchlist data and webhook delivery' },
  { category: 'Identity verification', purpose: 'Liveness, OCR and face match' },
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Security &amp; Architecture</span>
          </p>
          <h1 className="font-display mt-6 max-w-[22ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            Engineered for regulatory inspection.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            SOC 2 Type II in progress. UAE PDPL compliant. AES-256 at rest, TLS 1.3 in transit,
            UAE data residency in Bahrain. Every decision is oriented toward forensic defensibility
            under CBUAE, DFSA, FSRA, and VARA examination.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line bg-cream p-6"
              >
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
              <h2 className="text-[18px] font-semibold text-ink">Sub-processors</h2>
              <Link href="/legal/sub-processors" className="text-[13px] text-copper hover:underline">
                See full list →
              </Link>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              We disclose every sub-processor that touches customer data. The full list, with
              location and purpose, is on the legal page.
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
            <h2 className="text-[16px] font-semibold text-ink">Reporting a security issue</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              If you believe you have found a vulnerability in TruVis, email{' '}
              <a href="mailto:security@truvis.ae" className="text-copper hover:underline">
                security@truvis.ae
              </a>
              . We acknowledge within one business day and provide a remediation timeline within
              five. 72-hour breach notification SLA per UAE PDPL. Coordinated disclosure requested
              before public publication.
            </p>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to review our security controls?"
        body="Bring your security questionnaire. We will walk through SOC 2 controls, RLS policies, the hash-chained audit, and UAE data residency in 30 minutes."
        primaryLabel="Book a Demo"
        secondaryLabel="Read the DPA"
        secondaryHref="/legal/dpa"
      />
    </>
  );
}
