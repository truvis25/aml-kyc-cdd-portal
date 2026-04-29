import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2 text-[17px] font-medium text-ink">
            <span className="inline-block h-2 w-2 rounded-full bg-copper" aria-hidden="true" />
            TruVis
          </div>
          <p className="mt-4 max-w-sm font-display text-[22px] leading-[1.25] text-ink-soft">
            The MLRO&rsquo;s compliance workbench. Built for UAE.
          </p>
          <p className="mt-5 text-[13px] text-mute">Bahrain-resident · UAE-aligned</p>
        </div>

        <FooterColumn
          title="Product"
          className="lg:col-span-2"
          links={[
            { href: '/product', label: 'Overview' },
            { href: '/security', label: 'Security' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/book-demo', label: 'Book a demo' },
          ]}
        />

        <FooterColumn
          title="Industries"
          className="lg:col-span-2"
          links={[
            { href: '/for/dnfbps', label: 'DNFBPs' },
            { href: '/for/fintechs', label: 'Fintechs' },
          ]}
        />

        <FooterColumn
          title="Legal"
          className="lg:col-span-3"
          links={[
            { href: '/legal/terms', label: 'Terms of Service' },
            { href: '/legal/privacy', label: 'Privacy Policy' },
            { href: '/legal/dpa', label: 'Data Processing Agreement' },
            { href: '/legal/sub-processors', label: 'Sub-processors' },
          ]}
        />
      </div>
      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 text-[12px] text-mute sm:flex-row sm:items-center lg:px-10">
          <span>&copy; {new Date().getFullYear()} TruVis. All rights reserved.</span>
          <span>
            Questions?{' '}
            <Link href="/book-demo" className="text-ink underline-offset-4 hover:underline">
              Talk to us
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className = '',
}: {
  title: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
