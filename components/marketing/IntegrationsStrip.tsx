interface Integration {
  name: string;
  category: string;
}

const INTEGRATIONS: Integration[] = [
  { name: 'Embedded IDV', category: 'Identity' },
  { name: 'ComplyAdvantage', category: 'Screening' },
  { name: 'Resend', category: 'Email' },
  { name: 'Supabase', category: 'Database' },
  { name: 'Vercel', category: 'Hosting (me1)' },
  { name: 'goAML', category: 'FIU export' },
];

export function IntegrationsStrip() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Stack</span>
            </p>
            <h2 className="font-display mt-6 text-[32px] leading-[1.15] text-ink sm:text-[40px]">
              Sits above the tools you already trust.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              We don&rsquo;t replace your IDV provider or your screening data. TruVis is the
              compliance layer above them &mdash; queues, decisions, audit and SAR.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:col-span-8">
            {INTEGRATIONS.map((i) => (
              <li
                key={i.name}
                className="flex items-center justify-between gap-3 bg-paper px-5 py-5"
              >
                <span className="font-display text-[20px] text-ink">{i.name}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-mute">
                  {i.category}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
