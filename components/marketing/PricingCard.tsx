import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface PricingTier {
  name: string;
  price: string;
  cadence?: string;
  audience: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  highlight?: boolean;
}

export function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-white p-6 shadow-sm',
        tier.highlight ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200',
      )}
    >
      {tier.highlight && (
        <span className="mb-2 inline-block self-start rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          Recommended
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{tier.audience}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-gray-900">{tier.price}</span>
        {tier.cadence && <span className="text-sm text-gray-500">{tier.cadence}</span>}
      </div>
      <ul className="mt-5 space-y-2 text-sm text-gray-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.ctaHref}
        className={cn(
          'mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm',
          tier.highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
        )}
      >
        {tier.ctaLabel}
      </Link>
    </div>
  );
}
