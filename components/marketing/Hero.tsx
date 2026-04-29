import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pb-32 lg:pt-28 lg:px-10">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
          <span className="copper-rule" aria-hidden="true" />
          <span>Built for Federal Decree-Law No. 10 of 2025</span>
        </div>

        <h1 className="font-display mt-8 max-w-[18ch] text-[44px] leading-[1.04] text-ink sm:text-[64px] lg:text-[80px]">
          The MLRO&rsquo;s compliance
          <br className="hidden sm:block" /> workbench. Built for the <em className="not-italic text-copper">people on the hook</em>.
        </h1>

        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-soft">
          Onboard, screen, score, decide — with an immutable audit trail on every action.
          When a regulator inspects you two years from now, you have the evidence. Case-centric,
          role-aware, resident in Bahrain.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/book-demo"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium"
          >
            Book a 20-min demo
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/product"
            className="btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium"
          >
            See the workflow
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="mt-5 text-[13px] text-mute">
          No credit card required. Start a 14-day trial in under 10 minutes.
        </p>
      </div>
    </section>
  );
}
