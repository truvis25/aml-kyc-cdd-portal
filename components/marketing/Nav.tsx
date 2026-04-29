import Link from 'next/link';

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/product', label: 'Product' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/for/dnfbps', label: 'For DNFBPs' },
  { href: '/for/fintechs', label: 'For Fintechs' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-[17px] font-medium tracking-tight text-ink"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-copper" aria-hidden="true" />
          TruVis
        </Link>
        <nav className="hidden items-center gap-8 text-[14px] text-ink-soft md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-full px-3 py-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/book-demo"
            className="btn-primary rounded-full px-4 py-1.5 text-[14px] font-medium"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
