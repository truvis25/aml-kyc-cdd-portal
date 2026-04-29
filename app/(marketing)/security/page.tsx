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
      'Every tenant-scoped table has Row Level Security enabled. Tenancy is enforced in Postgres, not in our application code.',
    detail: [
      'Row Level Security on all tenant tables — no exceptions',
      'JWT enrichment via the Postgres custom_access_token_hook',
      'Service-role client confined to API route handlers; ESLint blocks misuse',
      'pgTAP tests on every RLS policy in CI',
    ],
  },
  {
    title: 'Append-only, hash-chained audit',
    body:
      'audit_log records every consequential action. UPDATE and DELETE are blocked at the database by trigger. Rows are hash-chained so tampering is detectable.',
    detail: [
      'Trigger blocks UPDATE and DELETE on audit_log',
      'Customer data versioning — never a bare UPDATE on customer fields',
      'IP addresses masked to /24 before storage',
      'JSON-L export for regulator handover',
    ],
  },
  {
    title: 'Authentication and MFA',
    body:
      'Supabase Auth with email + password and TOTP MFA. MFA is required for MLRO, Compliance Officer and Tenant Admin roles.',
    detail: [
      'TOTP MFA enforced for privileged roles',
      'Session cookies are httpOnly + Secure; CSRF safe by default in App Router actions',
      'RBAC checks at two layers: middleware (JWT) and API route (assertPermission)',
      'Failed sign-in attempts captured in audit_log',
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

const SUB_PROCESSORS: { name: string; purpose: string }[] = [
  { name: 'Supabase', purpose: 'Postgres database, authentication, file storage and edge functions' },
  { name: 'Vercel', purpose: 'Application hosting in region me1 (Bahrain)' },
  { name: 'Resend', purpose: 'Transactional email delivery (RAI, decisions, lead notifications)' },
  { name: 'ComplyAdvantage', purpose: 'Sanctions and PEP screening data and webhooks' },
  { name: 'Sumsub', purpose: 'Identity verification (liveness, OCR, face match)' },
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
            Built like the regulator is reading the logs.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            TruVis is engineered around the controls UAE regulators expect from a compliance
            platform — data residency, tenant isolation, audit immutability, MFA and least-privilege
            access. Here is how each is enforced.
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
            {SUB_PROCESSORS.map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <span className="font-medium text-gray-900">{s.name}</span>
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
        title="Want a deeper architecture review?"
        body="Bring your security questionnaire. We will walk through controls, RLS policies and the audit chain on a 30-minute call."
        primaryLabel="Request a security review"
      />
    </>
  );
}
