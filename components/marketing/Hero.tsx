import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* subtle copper grid hint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--tv-copper) 1px, transparent 1px), linear-gradient(to bottom, var(--tv-copper) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 lg:pb-32 lg:pt-24 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>AML / KYC / CDD · Built in the UAE</span>
            </div>

            <h1 className="font-display mt-8 max-w-[16ch] text-[46px] leading-[1.02] text-ink sm:text-[64px] lg:text-[78px]">
              The compliance workbench, built for the people <em className="not-italic text-copper">on the hook</em>.
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-soft">
              Onboard, screen, score and decide &mdash; with a hash-chained audit trail on every
              action. Case-centric, role-aware, and resident in Bahrain. Designed for the
              MLRO who has to defend every decision two years from now.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/book-demo"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium"
              >
                Book a 20-min demo
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/product"
                className="btn-secondary inline-flex items-center rounded-full px-6 py-3 text-[15px] font-medium"
              >
                Take the product tour
              </Link>
            </div>

            <p className="mt-5 text-[13px] text-mute">
              No credit card. Sandbox tenant ready in under 10 minutes.
            </p>
          </div>

          {/* Right column &mdash; product moment */}
          <div className="lg:col-span-5">
            <HeroProductCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroProductCard() {
  return (
    <div className="relative">
      {/* Floating receipt &mdash; audit chain peek */}
      <div className="absolute -right-3 -top-6 hidden w-[180px] rotate-[3deg] rounded-md border border-line bg-paper px-4 py-3 shadow-sm sm:block">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-mute">
          <span>Audit &middot; #18432</span>
          <span className="font-mono text-copper">0x9a4f&hellip;</span>
        </div>
        <div className="mt-2 space-y-1.5 font-mono text-[10.5px] leading-snug text-ink-soft">
          <div>14:02 &middot; case.opened</div>
          <div>14:08 &middot; screening.run</div>
          <div className="text-copper">14:11 &middot; hit.resolved</div>
          <div>14:14 &middot; risk.scored</div>
        </div>
      </div>

      {/* Main case card */}
      <div className="rounded-2xl border border-line bg-paper shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_40px_-24px_rgba(26,26,26,0.18)]">
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-mute">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-copper" aria-hidden="true" />
            <span className="font-mono">case &middot; #C-2026-0918</span>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50/60 px-2 py-0.5 text-[10.5px] font-medium text-amber-800">
            EDD review
          </span>
        </div>

        <div className="px-5 py-5">
          <div className="text-[12px] uppercase tracking-[0.16em] text-mute">Subject</div>
          <div className="font-display mt-2 text-[26px] leading-[1.1] text-ink">
            Aisha N. Al&nbsp;Reem
          </div>
          <div className="mt-1 text-[12.5px] text-mute">
            Sole proprietor &middot; Real estate brokerage &middot; Dubai
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <RiskTile label="Geography" value="Low" tone="neutral" />
            <RiskTile label="PEP" value="Medium" tone="warn" />
            <RiskTile label="Sanctions" value="0 hits" tone="neutral" />
          </div>

          <div className="mt-5 rounded-lg border border-line-soft bg-cream/40 px-4 py-3">
            <div className="flex items-baseline justify-between text-[12px] text-mute">
              <span>3-D risk band</span>
              <span className="font-mono">62 / 100</span>
            </div>
            <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="absolute left-0 top-0 h-full w-[62%] bg-copper" />
            </div>
            <div className="mt-2 text-[12.5px] text-ink-soft">
              <span className="font-medium text-ink">High</span> &rarr; route to MLRO queue, four-eyes required
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex -space-x-2">
              <span className="h-6 w-6 rounded-full border-2 border-paper bg-copper/80" />
              <span className="h-6 w-6 rounded-full border-2 border-paper bg-ink/80" />
              <span className="h-6 w-6 rounded-full border-2 border-paper bg-amber-700/70" />
            </div>
            <div className="flex items-center gap-2 text-[12px] text-mute">
              <span>Reviewed by</span>
              <span className="font-medium text-ink">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'warn';
}) {
  return (
    <div className="rounded-lg border border-line-soft bg-cream/40 px-3 py-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-mute">{label}</div>
      <div
        className={`mt-1 text-[14px] font-medium ${
          tone === 'warn' ? 'text-copper' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
