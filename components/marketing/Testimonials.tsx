interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  badge?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The case queue and the audit chain are the two things we&rsquo;ve always wanted. The fact that they&rsquo;re both there on day one is what made us a design partner.',
    author: 'Design Partner',
    role: 'MLRO',
    company: 'Tier-2 EMI &middot; Dubai',
    badge: 'Design partner',
  },
  {
    quote:
      'We can finally show our auditor the chain instead of a folder of PDFs. Onboarding moved from email threads to one workbench.',
    author: 'Design Partner',
    role: 'Compliance Officer',
    company: 'Real-estate brokerage &middot; Abu Dhabi',
    badge: 'Design partner',
  },
  {
    quote:
      'The four-eyes flow is a real four-eyes flow &mdash; not two checkboxes pretending. That&rsquo;s the difference between something we can defend and something we have to apologise for.',
    author: 'Design Partner',
    role: 'Tenant Admin',
    company: 'Gold trader &middot; DMCC',
    badge: 'Design partner',
  },
];

export function Testimonials() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>From the field</span>
          </p>
          <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
            Voices from our design partners.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-mute">
            Quotes are paraphrased and attributed to design-partner role &amp; vertical.
            Named references available on a signed NDA after the second call.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.quote}
              className="flex flex-col rounded-2xl border border-line bg-cream/40 p-7"
            >
              <span aria-hidden="true" className="font-display text-[60px] leading-none text-copper">
                &ldquo;
              </span>
              <blockquote
                className="mt-2 text-[15.5px] leading-relaxed text-ink"
                dangerouslySetInnerHTML={{ __html: t.quote }}
              />
              <figcaption className="mt-7 border-t border-line-soft pt-4 text-[13px] text-ink-soft">
                <div className="font-medium text-ink">{t.author}</div>
                <div className="mt-0.5 text-mute">
                  {t.role} &middot;{' '}
                  <span dangerouslySetInnerHTML={{ __html: t.company }} />
                </div>
                {t.badge && (
                  <div className="mt-3">
                    <span className="inline-block rounded-full border border-copper/40 bg-copper/10 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-copper">
                      {t.badge}
                    </span>
                  </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
