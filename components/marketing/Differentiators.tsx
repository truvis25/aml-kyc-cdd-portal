interface Differentiator {
  numeral: string;
  title: string;
  body: string;
}

const ITEMS: Differentiator[] = [
  {
    numeral: '01',
    title: 'One platform, end-to-end.',
    body: 'KYC onboarding, corporate KYB, AML screening, case management, SAR filing, and MLRO workbench in one workflow. Replace five tools with one.',
  },
  {
    numeral: '02',
    title: 'Audit-grade backbone.',
    body: 'Append-only, hash-chained audit log. Every decision, every document version, every access event &mdash; mathematically proven untampered.',
  },
  {
    numeral: '03',
    title: 'Real-time AML screening.',
    body: 'Screen against 235+ sanctions lists, PEP registers, and adverse media in under 150ms. Push alerts on every update &mdash; not batch.',
  },
  {
    numeral: '04',
    title: 'UAE-native regulatory stack.',
    body: 'Built for CBUAE, DFSA (DIFC), FSRA (ADGM), VARA, and UAE PDPL. Not a global platform adapted after the fact &mdash; UAE-native from the first line of code.',
  },
  {
    numeral: '05',
    title: 'Tipping-off-safe by construction.',
    body: 'SAR visibility is restricted to MLRO and Tenant Admin. The schema enforces it &mdash; analysts and reviewers literally cannot read SAR rows.',
  },
  {
    numeral: '06',
    title: 'Transparent SaaS pricing in AED.',
    body: 'Published AED tiers. Foundations, Compliance Suite, Enterprise. No quote-to-buy for the first two. No hidden per-verification sticker shock.',
  },
];

export function Differentiators() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>Why TruVis</span>
          </p>
          <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
            Six choices we made differently.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">
            None of them are accidental. Each is a position we have already had to defend
            in front of a regulator, an auditor, or our own MLRO.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((d) => (
            <div key={d.numeral} className="bg-paper px-7 py-8">
              <div className="font-display text-[20px] text-copper">{d.numeral}</div>
              <h3
                className="font-display mt-4 text-[22px] leading-[1.2] text-ink"
                dangerouslySetInnerHTML={{ __html: d.title }}
              />
              <p
                className="mt-3 text-[14px] leading-relaxed text-ink-soft"
                dangerouslySetInnerHTML={{ __html: d.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
