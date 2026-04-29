import Link from 'next/link';

export function ResourceTeaser() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid items-stretch gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-12">
          {/* Featured resource */}
          <article className="bg-paper px-8 py-9 lg:col-span-7">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-copper">
              <span>Briefing</span>
              <span className="text-mute">&middot; April 2026</span>
            </div>
            <h3 className="font-display mt-4 text-[30px] leading-[1.15] text-ink sm:text-[34px]">
              Federal Decree-Law No. 10 of 2025: what changed for compliance teams.
            </h3>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              A working summary of the new UAE AML regime. Twelve operational
              implications for MLROs &mdash; from extended record-keeping to expanded
              tipping-off enforcement &mdash; and the controls TruVis ships out of the box
              for each.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/book-demo"
                className="btn-primary inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                Request the briefing
              </Link>
              <span className="text-[13px] text-mute">12 pages &middot; PDF on request</span>
            </div>
          </article>

          {/* Side resources */}
          <ul className="grid bg-paper lg:col-span-5">
            <SideResource
              eyebrow="Playbook"
              title="The MLRO&rsquo;s first 14 days on TruVis."
              meta="6 min read"
            />
            <SideResource
              eyebrow="Reference"
              title="goAML XML &mdash; field-by-field."
              meta="Working doc"
            />
            <SideResource
              eyebrow="Architecture"
              title="Why we put RLS on every table."
              meta="3 min read"
            />
          </ul>
        </div>
      </div>
    </section>
  );
}

function SideResource({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta: string;
}) {
  return (
    <li className="border-b border-line-soft px-7 py-6 last:border-b-0">
      <div className="text-[11px] uppercase tracking-[0.16em] text-copper">{eyebrow}</div>
      <div
        className="mt-2 text-[16px] font-medium leading-snug text-ink"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="mt-2 text-[12px] text-mute">{meta}</div>
    </li>
  );
}
