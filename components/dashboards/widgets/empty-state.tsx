interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: React.ReactNode;
}

/**
 * Dashboard empty state — displayed when a data set returns zero rows.
 * Replaces the generic "Nothing to show" text with a centred card.
 */
export function EmptyState({ title, body, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-8 py-12 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {body && <p className="max-w-xs text-xs text-gray-400">{body}</p>}
    </div>
  );
}
