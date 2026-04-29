import Link from 'next/link';

interface Industry {
  name: string;
  body: string;
  bullets: string[];
  href: string;
}

const INDUSTRIES: Industry[] = [
  {
    name: 'Real estate brokerages',
    body: 'High-value transactions and politically exposed buyers. CDD on every party, ongoing monitoring on the relationship.',
    bullets: ['Beneficial owner mapping', 'EDD on cash purchases', 'AED transaction monitoring'],
    href: '/for/dnfbps',
  },
  {
    name: 'Gold &amp; precious-metal dealers',
    body: 'Bullion is regulated as DNFBP. Cash-threshold reports, risk-based CDD per FATF guidance.',
    bullets: ['CTR triggers from AED 55,000', 'Source-of-funds capture', 'goAML XML export'],
    href: '/for/dnfbps',
  },
  {
    name: 'Law firms &amp; CSPs',
    body: 'Trust formation and pooled-account scrutiny. Lawyer&rsquo;s privilege does not exempt the file.',
    bullets: ['Beneficial-owner declarations', 'PEP screening at engagement', 'Tipping-off-safe SAR queue'],
    href: '/for/dnfbps',
  },
  {
    name: 'EMIs, PSPs &amp; Tier-2 fintech',
    body: 'High onboarding volume, thin staffing. Automate the queue, keep the MLRO&rsquo;s decision in the loop.',
    bullets: ['Sumsub IDV passthrough', 'ComplyAdvantage screening', 'Per-tenant risk thresholds'],
    href: '/for/fintechs',
  },
];

export function IndustryGrid() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex items-end justify-between gap-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Who we&rsquo;re built for</span>
            </p>
            <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              The verticals on the FATF list, working with workflows that match.
            </h2>
          </div>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-2">
          {INDUSTRIES.map((i) => (
            <article key={i.name} className="bg-paper px-7 py-8">
              <h3
                className="font-display text-[24px] leading-[1.2] text-ink"
                dangerouslySetInnerHTML={{ __html: i.name }}
              />
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{i.body}</p>
              <ul className="mt-5 space-y-2 text-[13.5px] text-ink-soft">
                {i.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-[8px] inline-block h-1 w-2.5 flex-none bg-copper"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={i.href}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink underline-offset-[6px] hover:underline"
                >
                  See the workflow <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
