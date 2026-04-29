const BADGES: { title: string; body: string }[] = [
  {
    title: 'Bahrain-resident',
    body: 'Vercel and Supabase region me1 — your data and your audit log do not leave the GCC.',
  },
  {
    title: 'RLS on every table',
    body: 'Tenant isolation is enforced in Postgres, not application code. No exceptions.',
  },
  {
    title: 'Hash-chained audit',
    body: 'Append-only audit log. UPDATE and DELETE are blocked at the database.',
  },
  {
    title: 'MFA-required roles',
    body: 'TOTP MFA enforced for MLRO, Compliance Officer and Tenant Admin sign-ins.',
  },
];

export function TrustBadges() {
  return (
    <section className="bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24 lg:px-10">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
              <span className="copper-rule" aria-hidden="true" />
              <span>Built for evidence</span>
            </p>
            <h2 className="font-display mt-6 text-[40px] leading-[1.1] text-ink sm:text-[52px]">
              Engineered like the regulator <em className="not-italic text-copper">is reading</em> the logs.
            </h2>
          </div>
          <p className="text-[16px] leading-relaxed text-ink-soft lg:col-span-5">
            Every TruVis action — every screening, every decision, every document touch — is
            recorded in an immutable audit chain. Your MLRO can prove control, not just claim
            it.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b.title} className="bg-paper p-7">
              <div className="font-display text-[22px] leading-[1.2] text-ink">{b.title}</div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
