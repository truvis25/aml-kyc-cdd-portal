import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?:
    | { label: string; href: string }
    | { label: string; onClick: () => void };
  hint?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, action, hint, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-gray-300 bg-gray-50/40 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 ring-1 ring-gray-200">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-5">
          {'href' in action ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {action.label} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
      {hint ? <p className="mt-4 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}
