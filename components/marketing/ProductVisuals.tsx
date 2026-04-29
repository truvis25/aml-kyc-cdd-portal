/**
 * Editorial product visuals &mdash; faux UI compositions rendered with Tailwind
 * primitives. No screenshots, no third-party assets; everything stays inside
 * the Claude-style design language.
 */

export function OnboardingVisual() {
  const STEPS = [
    { label: 'Consent', state: 'done' as const },
    { label: 'Identity', state: 'done' as const },
    { label: 'IDV', state: 'active' as const },
    { label: 'Documents', state: 'pending' as const },
  ];
  return (
    <div className="rounded-2xl border border-line bg-cream/40 p-7 shadow-[0_18px_40px_-28px_rgba(26,26,26,0.18)]">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mute">
        Customer onboarding &middot; tenant.acme.ae
      </div>
      <div className="font-display mt-3 text-[24px] leading-tight text-ink">
        Welcome, Aisha. Let&rsquo;s verify the brokerage.
      </div>

      <ol className="mt-7 space-y-3">
        {STEPS.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center gap-3 rounded-md border border-line-soft bg-paper px-4 py-3"
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-medium ${
                s.state === 'done'
                  ? 'bg-ink text-paper'
                  : s.state === 'active'
                    ? 'bg-copper text-paper'
                    : 'border border-line text-mute'
              }`}
            >
              {s.state === 'done' ? '✓' : i + 1}
            </span>
            <span
              className={`text-[14px] ${
                s.state === 'pending' ? 'text-mute' : 'text-ink'
              }`}
            >
              {s.label}
            </span>
            {s.state === 'active' && (
              <span className="ml-auto text-[11px] uppercase tracking-[0.16em] text-copper">
                in&nbsp;progress
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-between text-[12px] text-mute">
        <span>Auto-saved &middot; resumable on any device</span>
        <span className="font-mono text-ink">3 of 4</span>
      </div>
    </div>
  );
}

export function DecideVisual() {
  return (
    <div className="rounded-2xl border border-line bg-cream/40 p-7 shadow-[0_18px_40px_-28px_rgba(26,26,26,0.18)]">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-mute">
        <span>3-D risk &middot; case #C-2026-0918</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px]">
          v1.4
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <RiskRow label="Geography" value={28} band="Low" />
        <RiskRow label="PEP exposure" value={62} band="Medium" />
        <RiskRow label="Sanctions / adverse" value={70} band="High" />
      </div>

      <div className="mt-6 rounded-lg border border-line-soft bg-paper px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-mute">Composite</span>
          <span className="font-display text-[28px] leading-none text-ink">
            62
            <span className="ml-1 text-[14px] text-mute">/100</span>
          </span>
        </div>
        <div className="mt-2 text-[12.5px] text-ink-soft">
          Routes to <span className="font-medium text-ink">MLRO queue</span> &middot;
          four-eyes required
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {['Analyst', 'Senior reviewer', 'MLRO'].map((r, i) => (
          <div
            key={r}
            className={`rounded-md border px-2 py-2 text-[11px] ${
              i === 2
                ? 'border-copper/60 bg-copper/10 text-copper'
                : 'border-line-soft bg-paper text-mute'
            }`}
          >
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskRow({
  label,
  value,
  band,
}: {
  label: string;
  value: number;
  band: 'Low' | 'Medium' | 'High';
}) {
  const tone =
    band === 'High' ? 'bg-copper' : band === 'Medium' ? 'bg-amber-500' : 'bg-ink/60';
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-mute">{value}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className={`absolute left-0 top-0 h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ProveVisual() {
  const ROWS: Array<{ time: string; event: string; actor: string; hash: string; tone?: 'copper' }> = [
    { time: '14:02:11', event: 'case.opened', actor: 'system', hash: '0x7f4c…' },
    { time: '14:08:40', event: 'screening.run', actor: 'noor.k', hash: '0x91b2…' },
    { time: '14:11:02', event: 'hit.resolved', actor: 'noor.k', hash: '0x3ad8…', tone: 'copper' },
    { time: '14:14:55', event: 'risk.scored', actor: 'system', hash: '0xc501…' },
    { time: '14:22:09', event: 'case.escalated', actor: 'noor.k', hash: '0x44ee…' },
    { time: '14:31:18', event: 'approval.granted', actor: 'mlro.r', hash: '0x9a4f…' },
  ];
  return (
    <div className="rounded-2xl border border-line bg-paper shadow-[0_18px_40px_-28px_rgba(26,26,26,0.18)]">
      <div className="flex items-center justify-between border-b border-line-soft px-6 py-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-mute">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-copper" aria-hidden="true" />
          audit_log
        </div>
        <span className="text-[11px] text-mute">append-only &middot; hash-chained</span>
      </div>
      <div className="divide-y divide-line-soft">
        {ROWS.map((r) => (
          <div
            key={r.hash}
            className="grid grid-cols-12 items-center gap-3 px-6 py-3 font-mono text-[12.5px]"
          >
            <span className="col-span-3 text-mute">{r.time}</span>
            <span
              className={`col-span-4 ${
                r.tone === 'copper' ? 'text-copper' : 'text-ink'
              }`}
            >
              {r.event}
            </span>
            <span className="col-span-3 text-mute">{r.actor}</span>
            <span className="col-span-2 text-right text-mute">{r.hash}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-line-soft px-6 py-3 text-[11.5px] text-mute">
        Each row links to the previous via SHA-256. One tampered byte breaks the chain.
      </div>
    </div>
  );
}
