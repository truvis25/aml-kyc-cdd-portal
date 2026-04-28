import Link from 'next/link';

interface QueueRow {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}

interface QueueSummaryProps {
  title: string;
  rows: QueueRow[];
  emptyText?: string;
}

export function QueueSummary({ title, rows, emptyText = 'Nothing to show' }: QueueSummaryProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => {
            const content = (
              <div className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-gray-900">{row.label}</p>
                  {row.hint && <p className="text-xs text-gray-400 mt-0.5">{row.hint}</p>}
                </div>
                <span className="font-semibold text-gray-900 tabular-nums">{row.value}</span>
              </div>
            );
            return (
              <li key={row.label}>
                {row.href ? (
                  <Link href={row.href} className="block hover:bg-gray-50 -mx-2 px-2 rounded">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
