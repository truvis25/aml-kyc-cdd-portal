import Link from 'next/link';

export function CTASection({
  title = 'See TruVis on your own data.',
  body = 'Bring an anonymised customer file. We will walk you through onboarding, screening, risk and the audit trail in 20 minutes.',
  primaryHref = '/book-demo',
  primaryLabel = 'Book a 20-min demo',
  secondaryHref = '/pricing',
  secondaryLabel = 'See pricing',
}: {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="bg-blue-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
            <p className="mt-3 text-blue-50">{body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="rounded-md border border-white/30 bg-transparent px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
