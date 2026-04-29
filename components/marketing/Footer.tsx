import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
            TruVis
          </div>
          <p className="mt-3 max-w-xs text-sm text-gray-600">
            The MLRO&apos;s compliance workbench. Built for UAE.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Data resident in Bahrain (UAE-aligned).
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { href: '/product', label: 'Overview' },
            { href: '/security', label: 'Security' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/book-demo', label: 'Book a demo' },
          ]}
        />

        <FooterColumn
          title="Compare"
          links={[
            { href: '/compare/sumsub', label: 'vs Sumsub' },
            { href: '/compare/azakaw', label: 'vs Azakaw' },
            { href: '/for/dnfbps', label: 'For DNFBPs' },
            { href: '/for/fintechs', label: 'For Fintechs' },
          ]}
        />

        <FooterColumn
          title="Legal"
          links={[
            { href: '/legal/terms', label: 'Terms of Service' },
            { href: '/legal/privacy', label: 'Privacy Policy' },
            { href: '/legal/dpa', label: 'Data Processing Agreement' },
            { href: '/legal/sub-processors', label: 'Sub-processors' },
          ]}
        />
      </div>
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} TruVis. All rights reserved.</span>
          <span>
            Questions?{' '}
            <Link href="/book-demo" className="text-blue-600 hover:underline">Talk to us</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-gray-700 hover:text-gray-900">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
