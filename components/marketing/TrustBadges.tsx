const BADGES: { title: string; body: string }[] = [
  {
    title: 'SOC 2 Type II',
    body: 'Independent auditor certification covering security, availability, and confidentiality controls.',
  },
  {
    title: 'ISO 27001',
    body: 'Information security management certification — planned. Controls already mapped and in place.',
  },
  {
    title: 'UAE Data Residency',
    body: 'Hosted on Vercel me1 (Bahrain). Customer data and audit logs never leave the GCC by default.',
  },
  {
    title: 'goAML Native',
    body: 'SAR export as goAML XML. SHA-256 hash bound to the audit row for regulator-verified integrity.',
  },
  {
    title: 'UAE Pass',
    body: 'UAE Pass liveness and Emirates ID parse integrated into the KYC onboarding flow.',
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

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
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
