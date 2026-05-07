import Link from 'next/link';

export function CTASection({
  title = 'CBUAE-examination-ready in 30 days — speak to our Gulf compliance team.',
  body = 'Reserve your demo — 30 minutes, no pitch deck, your workflow our focus.',
  primaryHref = '/book-demo',
  primaryLabel = 'Book a Demo',
  secondaryHref = '/signup',
  secondaryLabel = 'Start Free Trial',
}: {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="rounded-3xl bg-ink p-10 text-paper sm:p-14 lg:p-20">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#C9BFA8]">
            <span className="inline-block h-px w-7 bg-copper" aria-hidden="true" />
            <span>Talk to us</span>
          </p>
          <h2 className="font-display mt-6 max-w-3xl text-[40px] leading-[1.1] text-paper sm:text-[56px]">
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#D9D2C4]">{body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white"
            >
              {primaryLabel}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center rounded-full border border-[#3A342D] px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-[#2A2520]"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
