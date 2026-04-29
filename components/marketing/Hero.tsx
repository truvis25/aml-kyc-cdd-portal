import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
            Bahrain-resident · UAE-aligned
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            The MLRO&apos;s compliance workbench. Built for UAE.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-700">
            Onboard, screen, score and decide — with hash-chained audit on every action.
            TruVis is the case-centric AML/KYC platform compliance officers actually want to use.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/book-demo"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Book a 20-min demo
            </Link>
            <Link
              href="/product"
              className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              See product tour
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card. Sandbox tenant ready in under 10 minutes.
          </p>
        </div>
      </div>
    </section>
  );
}
