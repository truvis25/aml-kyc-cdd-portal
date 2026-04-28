import Link from 'next/link';

interface Props {
  /** Path of the current page (e.g. "/cases"). */
  basePath: string;
  /** Existing query parameters to preserve when building page links. */
  params: URLSearchParams;
  /** 1-indexed current page. */
  currentPage: number;
  /** Number of rows on the current page (used for the "Showing X–Y" copy). */
  rowsOnPage: number;
  /** Per-page size used by the caller's query. */
  pageSize: number;
  /** True when the caller fetched (pageSize + 1) and got pageSize+1 back. */
  hasNextPage: boolean;
}

/**
 * Render a "Showing X–Y · Previous · Next" footer. Caller is responsible for
 * passing `hasNextPage` based on whether their query returned more than the
 * page size (the standard "fetch one extra" trick).
 */
export function Pagination({
  basePath,
  params,
  currentPage,
  rowsOnPage,
  pageSize,
  hasNextPage,
}: Props) {
  const offset = (currentPage - 1) * pageSize;

  function buildUrl(p: number): string {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    return `${basePath}?${next.toString()}`;
  }

  if (rowsOnPage === 0 && currentPage === 1 && !hasNextPage) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
      <span>
        {rowsOnPage === 0
          ? 'No rows on this page'
          : `Showing ${offset + 1}–${offset + rowsOnPage}`}
      </span>
      <div className="flex gap-2">
        {currentPage > 1 && (
          <Link
            href={buildUrl(currentPage - 1)}
            className="rounded px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50"
          >
            Previous
          </Link>
        )}
        {hasNextPage && (
          <Link
            href={buildUrl(currentPage + 1)}
            className="rounded px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
