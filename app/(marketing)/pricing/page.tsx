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
      'KYC onboarding — identity verification and document checks',
      'AML screening — sanctions and PEP registers',
      'Case management with full audit trail',
      'Permanent record of every compliance decision',
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
      'Four-eyes enforcement — two sign-offs required before any case closes',
      'UAE Pass sign-in and Emirates ID reading built in',
      'SAR drafting with goAML XML export',
      'EDD section with structured evidence capture',
      'Audit trail export and 7-year retention',
      'Advanced risk scoring with configurable thresholds per tenant',
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
      'Dedicated UAE-based infrastructure',
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
    a: 'All customer data and audit records are stored in UAE-based infrastructure. Your data does not leave the GCC for processing or storage without your written instruction. See the Security page for details.',
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
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Pricing</span>
          </p>
          <h1 className="font-display mt-6 max-w-[28ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            Transparent pricing in AED. No NDA required.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Most compliance platforms hide their price until you sign a non-disclosure. TruVis
            publishes in AED so you know what you pay before the demo. Every tier includes a
            permanent audit trail your regulator can inspect.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((t) => (
              <PricingCard key={t.name} tier={t} />
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-[13px] text-mute">
            Prices exclude VAT. Annual billing earns a 15% discount on Foundations and Compliance Suite.
            Start a 14-day free trial with no credit card —{' '}
            <Link href="/signup" className="text-copper hover:underline">
              sign up now
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Pricing FAQ</span>
          </p>
          <h2 className="font-display mt-5 text-[32px] leading-[1.15] text-ink">
            Common questions.
          </h2>
          <dl className="mt-8 divide-y divide-line border-t border-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-[15px] font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-ink-soft">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CTASection
        title="Not sure which tier fits? Ask us."
        body="30 minutes, no pitch deck. We&rsquo;ll recommend the right tier on the call."
        primaryLabel="Book a Demo"
        secondaryLabel="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}
