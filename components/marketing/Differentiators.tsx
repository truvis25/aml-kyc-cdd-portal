interface Differentiator {
  numeral: string;
  title: string;
  body: string;
}

const ITEMS: Differentiator[] = [
  {
    numeral: '01',
    title: 'Case-first, not API-first.',
    body: 'Workbench, queues, four-eyes &mdash; designed for compliance staff. Engineers don&rsquo;t need to wire a workflow before the team can work a case.',
  },
  {
    numeral: '02',
    title: 'Audit you can defend two years later.',
    body: 'Append-only and hash-chained at the database. Every decision links to every artefact: form revision, signed-URL request, screening hit, four-eyes approval.',
  },
  {
    numeral: '03',
    title: 'UAE-resident by design.',
    body: 'Bahrain region (me1) by default. Row-level security on every tenant-scoped table. MFA required for MLRO and Tenant Admin roles.',
  },
  {
    numeral: '04',
    title: 'Tipping-off-safe by construction.',
    body: 'SAR visibility is restricted to MLRO and Tenant Admin. The schema enforces it &mdash; analysts and reviewers literally cannot read SAR rows.',
  },
  {
    numeral: '05',
    title: 'Transparent SaaS pricing.',
    body: 'Published AED tiers. Starter ships in days, Growth scales the team, Enterprise adds SSO and SLA. No quote-to-buy.',
  },
  {
    numeral: '06',
    title: 'No PII in logs &mdash; ever.',
    body: 'Application logs use customer_id, case_id, session_id. Names, DOBs and ID numbers never enter logging pipelines. Sanitiser-enforced in CI.',
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
