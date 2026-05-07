import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingCard, type PricingTier } from '@/components/marketing/PricingCard';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Pricing — Transparent AED tiers for regulated firms',
  description:
    'TruVis pricing published in AED. Foundations, Compliance Suite, and Enterprise tiers. No NDA required to see what you pay.',
};

const TIERS: PricingTier[] = [
  {
    name: 'Foundations',
    price: 'AED 2,500',
    cadence: '/ month',
    audience: 'For growing fintechs and DNFBPs. Up to 500 customer records.',
    features: [
      'Up to 500 customer records',
      'KYC onboarding with liveness and document parse',
      'AML screening — sanctions and PEP registers',
      'Basic case management with audit trail',
      'Append-only hash-chained audit log on every action',
      'Email support, 1 business day response SLA',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Book a Demo',
  },
  {
    name: 'Compliance Suite',
    price: 'AED 8,500',
    cadence: '/ month',
    audience: 'For regulated FIs and multi-entity groups. Unlimited customers.',
    features: [
      'Unlimited customer records',
      'Full MLRO workbench with role-aware case queues',
      'Four-eyes enforcement on approvals',
      'UAE Pass liveness and Emirates ID parse',
      'SAR drafting with goAML XML export',
      'EDD section with structured evidence capture',
      'Audit trail export and 7-year retention',
      'Advanced risk scoring — 3-D model with per-tenant thresholds',
      'Priority support, same-day response SLA',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Book a Demo',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    audience: 'White-label, multi-tenant. For banks, holding groups, and platform operators.',
    features: [
      'White-label multi-tenant deployment',
      'Custom workflow rules and risk model configuration',
      'Dedicated customer success manager',
      'Contractual uptime SLA with incident response',
      'Penetration test reports available under NDA',
      'SSO (SAML 2.0 and OpenID Connect)',
      'Dedicated infrastructure in Bahrain region (me1)',
      'Data Processing Agreement and sub-processor disclosures',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Talk to our Gulf team →',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is pricing in AED?',
    a: 'Yes. All published prices are in UAE Dirhams (AED), exclusive of VAT. Annual prepayment earns a 15% discount on Foundations and Compliance Suite tiers. Enterprise is priced on contract.',
  },
  {
    q: 'Can I switch tiers later?',
    a: 'Yes. You can upgrade or downgrade at the next billing cycle. Upgrading mid-cycle is prorated. Downgrading takes effect at renewal. Your audit trail and data are always portable.',
  },
  {
    q: 'What data residency do you provide?',
    a: 'All customer data and audit logs are stored in Supabase region me1 (Bahrain) and served from Vercel region me1. Your data does not leave the GCC for processing or storage without your written instruction. See the Security page for architecture detail.',
  },
  {
    q: 'Is implementation support included?',
    a: 'Foundations and Compliance Suite include onboarding documentation and email support. Compliance Suite customers receive a dedicated onboarding call to configure tenant branding, document types, and risk thresholds. Enterprise includes a named implementation engineer.',
  },
  {
    q: 'Do you have a free trial?',
    a: 'Yes. A 14-day free trial with full Compliance Suite access is available with no credit card required. You can start from the signup page or request a guided trial via the demo booking.',
  },
];

export default function PricingPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Pricing</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Transparent pricing in AED. No NDA required.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            Most compliance platforms hide their price until you sign a non-disclosure. TruVis
            publishes in AED so you know what you pay before the demo. Every tier includes the
            hash-chained audit trail your regulator will inspect.
          </p>
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((t) => (
              <PricingCard key={t.name} tier={t} />
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm text-gray-500">
            Prices exclude VAT. Annual billing earns a 15% discount on Foundations and Compliance Suite.
            Start a 14-day free trial with no credit card —{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              sign up now
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50/60">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Pricing FAQ
          </h2>
          <dl className="mt-8 divide-y divide-gray-200 border-t border-gray-200">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-base font-semibold text-gray-900">{item.q}</dt>
                <dd className="mt-2 text-sm text-gray-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CTASection
        title="Not sure which tier fits? Ask us."
        body="Reserve your demo — 30 minutes, no pitch deck, your workflow our focus. We will recommend the right tier on the call."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
