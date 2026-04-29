import Link from 'next/link';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
          TruVis
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-gray-700 md:flex">
          <Link href="/product" className="hover:text-gray-900">Product</Link>
          <Link href="/security" className="hover:text-gray-900">Security</Link>
          <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
          <div className="group relative">
            <button className="hover:text-gray-900" type="button">Compare</button>
            <div className="invisible absolute right-0 top-full mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg group-hover:visible">
              <Link href="/compare/sumsub" className="block px-3 py-1.5 text-sm hover:bg-gray-50">vs Sumsub</Link>
              <Link href="/compare/azakaw" className="block px-3 py-1.5 text-sm hover:bg-gray-50">vs Azakaw</Link>
            </div>
          </div>
          <div className="group relative">
            <button className="hover:text-gray-900" type="button">For</button>
            <div className="invisible absolute right-0 top-full mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg group-hover:visible">
              <Link href="/for/dnfbps" className="block px-3 py-1.5 text-sm hover:bg-gray-50">DNFBPs</Link>
              <Link href="/for/fintechs" className="block px-3 py-1.5 text-sm hover:bg-gray-50">Fintechs</Link>
            </div>
          </div>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden text-sm text-gray-700 hover:text-gray-900 sm:inline">
            Sign in
          </Link>
          <Link
            href="/book-demo"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
