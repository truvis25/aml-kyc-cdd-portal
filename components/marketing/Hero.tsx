import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pb-32 lg:pt-28 lg:px-10">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
          <span className="copper-rule" aria-hidden="true" />
          <span>CBUAE-examination-ready &middot; goAML native &middot; UAE Pass integrated</span>
        </div>

        <h1 className="font-display mt-8 max-w-[18ch] text-[44px] leading-[1.04] text-ink sm:text-[64px] lg:text-[80px]">
          Onboard customers with confidence &mdash;{' '}
          <em className="not-italic text-copper">UAE AML compliance, automated</em>.
        </h1>

        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-soft">
          TruVis is the UAE-native compliance platform built for MLROs, fintechs, and DNFBPs.
          CBUAE-examination-ready. goAML native. UAE Pass integrated. Every decision backed by a
          hash-chained audit log you can hand to a regulator today.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/book-demo"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium"
          >
            Book a Demo
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/signup"
            className="btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium"
          >
            Start Free Trial
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="mt-5 text-[13px] text-mute">
          No credit card required. Full Compliance Suite access for 14 days.
        </p>
      </div>
    </section>
  );
}
