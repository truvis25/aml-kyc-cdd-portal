interface ErrorCardProps {
  title?: string;
  message?: string;
}

/**
 * Dashboard error card — displayed when a widget's data fetch throws.
 * Used inside per-widget error boundaries (wrapped at the dashboard level).
 */
export function ErrorCard({ title = 'Could not load this widget', message }: ErrorCardProps) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-5">
      <p className="text-sm font-medium text-red-700">{title}</p>
      {message && <p className="mt-1 text-xs text-red-500">{message}</p>}
      <p className="mt-2 text-xs text-red-400">Refresh the page to retry.</p>
    </div>
  );
}
