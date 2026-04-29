import Link from 'next/link';

export interface ProductSectionProps {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  visual: React.ReactNode;
  reverse?: boolean;
}

export function ProductSection(props: ProductSectionProps) {
  const { eyebrow, title, body, bullets, ctaLabel, ctaHref, visual, reverse } = props;
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
        <div
          className={`grid items-center gap-14 lg:grid-cols-12 ${
            reverse ? 'lg:[direction:rtl]' : ''
          }`}
        >
          <div className="lg:col-span-6 lg:[direction:ltr]">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>{eyebrow}</span>
            </p>
            <h2 className="font-display mt-6 max-w-[18ch] text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              {title}
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft">{body}</p>

            <ul className="mt-8 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14.5px] text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] inline-block h-1 w-3 flex-none bg-copper"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 text-[14.5px] font-medium text-ink underline-offset-[6px] hover:underline"
              >
                {ctaLabel}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 lg:[direction:ltr]">{visual}</div>
        </div>
      </div>
    </section>
  );
}
