interface Stat {
  numeral: string;
  unit?: string;
  label: string;
  hint: string;
}

const STATS: Stat[] = [
  {
    numeral: '5',
    unit: 'M',
    label: 'AED — max fine per violation',
    hint: 'Federal Decree-Law No. 10 of 2025: the cost of being unprepared',
  },
  {
    numeral: '14',
    unit: 'd',
    label: 'From sign-up to live, production-ready tenant',
    hint: 'Including Bahrain data residency and audit chain',
  },
  {
    numeral: '0',
    label: 'Bytes of customer PII leaving the GCC',
    hint: 'Bahrain region (me1) — data residency guaranteed',
  },
  {
    numeral: '100',
    unit: '%',
    label: 'Of compliance decisions stored in immutable audit',
    hint: 'Hash-chained, tamper-detectable, 10-year retention',
  },
];

export function StatsBanner() {
  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="mb-10 flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
          <span className="copper-rule" aria-hidden="true" />
          <span>Built to a regulator&rsquo;s standard, not a marketer&rsquo;s</span>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-paper px-7 py-8">
              <div className="font-display flex items-baseline text-[64px] leading-none text-ink sm:text-[72px]">
                <span>{s.numeral}</span>
                {s.unit && (
                  <span className="ml-1 text-[28px] text-copper sm:text-[32px]">
                    {s.unit}
                  </span>
                )}
              </div>
              <div className="mt-4 text-[14.5px] font-medium leading-snug text-ink">
                {s.label}
              </div>
              <div className="mt-2 text-[12.5px] text-mute">{s.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
