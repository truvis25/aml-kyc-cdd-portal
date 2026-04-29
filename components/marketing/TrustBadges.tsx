const BADGES: { title: string; body: string }[] = [
  {
    title: 'Bahrain-resident',
    body: 'Vercel me1 + Supabase region, aligned with UAE data-residency expectations.',
  },
  {
    title: 'RLS on every table',
    body: 'Tenant isolation enforced in Postgres — not in the application layer.',
  },
  {
    title: 'Hash-chained audit',
    body: 'Append-only audit_log; UPDATE and DELETE are blocked at the DB.',
  },
  {
    title: 'MFA enforced',
    body: 'TOTP MFA required for MLRO, Compliance Officer and Tenant Admin roles.',
  },
];

export function TrustBadges() {
  return (
    <section className="border-y border-gray-200 bg-gray-50/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Built like the regulator is reading the logs.
          </h2>
          <p className="mt-3 text-gray-700">
            Every TruVis action — every screening, every decision, every document touch — is
            recorded in an immutable audit chain. Your MLRO can prove control, not just claim it.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b.title} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="text-sm font-semibold text-gray-900">{b.title}</div>
              <p className="mt-2 text-sm text-gray-600">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
