import type { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Security & Architecture',
  description:
    'How TruVis is built: Bahrain-resident, RLS-on-every-table, append-only hash-chained audit, MFA-enforced, signed-URL-only document access.',
};

const PRINCIPLES: { title: string; body: string; detail?: string[] }[] = [
  {
    title: 'Bahrain data residency',
    body:
      'TruVis runs in Vercel region me1 with Supabase region matched. Your customer data and audit log do not leave the GCC for compute or storage.',
    detail: [
      'Vercel App Router region: me1 (Bahrain)',
      'Supabase Postgres + Storage in the same region',
      'No cross-region replicas without your written instruction',
    ],
  },
  {
    title: 'Tenant isolation at the database',
    body:
      "Data isolation is enforced in Postgres via Row Level Security, not in application code. No configuration error or code bug can allow one tenant to see another's data.",
    detail: [
      'Row Level Security on every tenant table — enforced by database trigger',
      'JWT enrichment via Postgres custom_access_token_hook embeds tenant_id in token',
      'Service-role client confined to API route handlers only; ESLint blocks misuse in components',
      'pgTAP integration tests verify RLS on every policy in CI',
      'Cross-tenant query attempt hits database policy denial, not app logic',
    ],
  },
  {
    title: 'Append-only, hash-chained audit',
    body:
      'Every compliance action lands in an immutable ledger. UPDATE and DELETE are forbidden at the database layer. Rows are cryptographically hash-chained so any tampering is immediately detectable. When a regulator audits your systems, the chain is unbroken.',
    detail: [
      'Database trigger blocks UPDATE and DELETE on audit_log — no exceptions',
      'Customer data versioning — every field change is a new row, never overwritten',
      'SHA-256 hash chain: each row commits to the previous row',
      'Tampering detection: SHA-256 hash change breaks the chain visibly',
      'IP addresses masked to /24 before storage — geographic only',
      'JSON-L export with full chain for regulator handover',
    ],
  },
  {
    title: 'Authentication and role-based access control',
    body:
      'TOTP MFA is required for any user who can approve cases or access SAR queue. RBAC is enforced at two layers — JWT middleware and API route — so no privilege escalation is possible.',
    detail: [
      'TOTP MFA enforced for MLRO, Compliance Officer, Tenant Admin roles',
      'Session cookies are httpOnly + Secure; CSRF safe by default',
      'RBAC checked twice: JWT middleware (deny fast) then API route (deny late)',
      'Failed sign-in attempts and permission denials logged to audit_log',
      'Token revocation on MFA disable or role change',
    ],
  },
  {
    title: 'Document handling',
    body:
      'Customer documents live in private Supabase Storage buckets. Access is gated by 15-minute signed URLs generated per request.',
    detail: [
      'Private buckets — no public read',
      'Signed URLs valid for 15 minutes; never cached server-side',
      'Document hash computed via Edge Function and recorded in audit_log',
    ],
  },
  {
    title: 'No PII in logs',
    body:
      'Application logs go through a sanitiser that redacts known PII keys and patterns. A CI scan blocks new raw console.* call-sites.',
    detail: [
      'Sanitiser strips name, DOB, ID numbers and address-shaped strings',
      'check:pii script runs on every PR',
      'Error objects are reduced to class names — never message or stack',
    ],
  },
  {
    title: 'Async work is queued, never lost',
    body:
      'Webhook events from screening and IDV providers are enqueued before processing. Failures retry on an hourly pg_cron schedule with exponential backoff.',
    detail: [
      'webhook_events queue, deterministic retry on failure',
      'retry-failed-webhooks Edge Function on hourly pg_cron',
      'Operator visibility via the webhook ops viewer',
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
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Security &amp; Architecture
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Engineered for regulatory inspection.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            When Federal Decree-Law No. 10 of 2025 requires data residency, audit immutability, and four-eyes enforcement, TruVis is built to prove it. Every architectural decision is oriented toward forensic defensibility.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <section
              key={p.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
              <p className="mt-2 text-sm text-gray-700">{p.body}</p>
              {p.detail && (
                <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                  {p.detail.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Sub-processors</h2>
            <Link href="/legal/sub-processors" className="text-sm text-blue-600 hover:underline">
              See full list →
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            We disclose every sub-processor that touches customer data. The full list, with
            location and purpose, is on the legal page.
          </p>
          <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {SUB_PROCESSORS_OVERVIEW.map((s) => (
              <li key={s.category} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <span className="font-medium text-gray-900">{s.category}</span>
                <span className="text-right text-gray-700">{s.purpose}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-xl border border-gray-200 bg-gray-50/60 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Reporting a security issue</h2>
          <p className="mt-2 text-sm text-gray-700">
            If you believe you have found a vulnerability in TruVis, please email{' '}
            <a href="mailto:security@truvis.ae" className="text-blue-700 hover:underline">
              security@truvis.ae
            </a>
            . We aim to acknowledge within one business day and provide a remediation timeline
            within five.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            We do not currently operate a public bounty programme; please coordinate disclosure
            before publishing details.
          </p>
        </section>
      </div>

      <CTASection
        title="Ready to audit the architecture?"
        body="Bring your security questionnaire and the Federal Decree-Law compliance checklist. We will walk through controls, RLS policies, the hash-chained audit and data residency on a 30-minute call."
      />
    </>
  );
}
