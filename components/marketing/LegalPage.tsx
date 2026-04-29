export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6 text-[15px] leading-relaxed text-gray-800 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1 [&_a]:text-blue-700 [&_a:hover]:underline">
          {children}
        </div>
        <p className="mt-12 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Notice.</strong> This page is provided for transparency and is not legal advice.
          Final binding terms are those signed by your authorised representative on a TruVis
          customer agreement. Contact{' '}
          <a href="mailto:legal@truvis.ae">legal@truvis.ae</a> for the executable form.
        </p>
      </div>
    </article>
  );
}
