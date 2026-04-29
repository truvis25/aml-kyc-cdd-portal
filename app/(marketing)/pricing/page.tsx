import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingCard, type PricingTier } from '@/components/marketing/PricingCard';
import { CTASection } from '@/components/marketing/CTASection';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent monthly pricing for TruVis. Starter, Growth and Enterprise tiers — published in AED.',
};

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: 'AED 1,500',
    cadence: '/ month',
    audience: 'Single-entity DNFBPs and early-stage fintechs.',
    features: [
      '1 staff seat',
      'Up to 100 verifications / month',
      'KYC, KYB and sanctions / PEP screening',
      'Standard onboarding portal (TruVis branding)',
      'Email support, 1 business day SLA',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Start with a demo',
  },
  {
    name: 'Growth',
    price: 'AED 5,000',
    cadence: '/ month',
    audience: 'Multi-team DNFBPs, EMIs and Tier-2 fintechs.',
    features: [
      '5 staff seats (additional seats available)',
      'Up to 500 verifications / month',
      'Full case workflow + four-eyes approvals',
      'Tenant-branded customer portal',
      'goAML SAR register and JSON-L export',
      'Arabic UI (when generally available)',
      'Priority support, same-day SLA',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Talk to sales',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    audience: 'Banks, regulated FIs, and groups with multiple licensed entities.',
    features: [
      'Unlimited seats and verifications',
      'SSO (SAML / OIDC)',
      'Dedicated tenant on isolated infrastructure',
      'Named customer success engineer',
      'Contractual uptime SLA + DPA add-ons',
      'Security questionnaire and architecture review',
    ],
    ctaHref: '/book-demo',
    ctaLabel: 'Request a quote',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How is a “verification” counted?',
    a: 'One completed onboarding session — the customer reaches a terminal state (approved, rejected, or formally withdrawn) — counts as one verification. Resumed sessions and partial submissions are not counted twice.',
  },
  {
    q: 'What happens if we exceed our monthly verification cap?',
    a: 'We will not block ongoing onboardings. Overages are invoiced at the next billing cycle at AED 12 per verification on Starter and AED 8 on Growth. We will notify your admins before any overage is incurred.',
  },
  {
    q: 'Are IDV and screening provider fees included?',
    a: 'Identity verification and sanctions / PEP screening are passed through at our wholesale rate during early-access. From Q3 we will publish a fixed per-verification figure that bundles both.',
  },
  {
    q: 'Do you support Arabic and RTL?',
    a: 'Arabic UI and RTL layout are on the Growth roadmap and will ship to existing Growth customers at no additional cost.',
  },
  {
    q: 'Can we self-host or have a dedicated database?',
    a: 'Dedicated tenant infrastructure (separate Supabase project) is available on the Enterprise tier. We do not currently offer customer-hosted deployments.',
  },
];

export default function PricingPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Pricing</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Transparent. Published. In AED.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            Most AML platforms hide their price. We don&apos;t. Pick a tier, see what you pay,
            and book a demo when you&apos;re ready to talk specifics.
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
            Prices exclude VAT. Annual billing earns a 15% discount on Starter and Growth.
            Design-partner cohorts get the first six months free in exchange for a case study —
            <Link href="/book-demo" className="ml-1 text-blue-600 hover:underline">
              ask us about it
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
        title="Pick a tier, book a 20-minute demo."
        body="We will help you choose the right tier and answer pricing questions on the call."
      />
    </>
  );
}
