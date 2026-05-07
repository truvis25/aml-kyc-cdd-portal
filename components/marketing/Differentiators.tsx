interface Differentiator {
  numeral: string;
  title: string;
  body: string;
}

const ITEMS: Differentiator[] = [
  {
    numeral: '01',
    title: 'Everything in one place.',
    body: 'KYC onboarding, AML screening, case review, SAR filing, and the MLRO workbench — all connected. No switching between tools, no re-entering data, no gaps between systems.',
  },
  {
    numeral: '02',
    title: 'A record your regulator can trust.',
    body: 'Every decision, approval, and document change is permanently recorded and can never be altered. When an examiner asks what happened on a case, you pull the file &mdash; it&rsquo;s all there.',
  },
  {
    numeral: '03',
    title: 'AML screening that keeps up.',
    body: 'Screen customers against hundreds of sanctions lists, PEP registers, and adverse media sources the moment they apply. Get alerted when a match appears &mdash; not after the weekly batch run.',
  },
  {
    numeral: '04',
    title: 'Designed for UAE regulators.',
    body: 'Built for CBUAE, DFSA (DIFC), FSRA (ADGM), and VARA from the ground up. UAE Pass sign-in, Emirates ID reading, goAML filing, and AED pricing &mdash; not an afterthought.',
  },
  {
    numeral: '05',
    title: 'SAR confidentiality enforced.',
    body: 'Only your MLRO and Compliance Officer can see Suspicious Activity Reports. Analysts and reviewers cannot access them &mdash; protecting your firm from tipping-off risk.',
  },
  {
    numeral: '06',
    title: 'Pricing you can read.',
    body: 'Published AED tiers. Starter, Compliance Suite, Enterprise. No quote required for the first two tiers. No surprise charges per verification on top.',
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
            Six things that matter to compliance teams.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">
            We built TruVis by talking to MLROs, compliance officers, and regulators —
            not by adapting a product designed for a different market.
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
